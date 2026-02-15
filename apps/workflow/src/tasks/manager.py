import asyncio
import logging
from typing import Any

from pydantic_ai import ModelMessagesTypeAdapter
from pydantic_ai.messages import ModelMessage, ModelResponse, ThinkingPart, TextPart
from pydantic_core import to_jsonable_python

from src.models import (
    MessageType,
    ThinkingPayload,
    TextDeltaPayload,
    EndOfTurnPayload,
    ErrorPayload,
    create_message,
)
from src.pubsub import PubSubService
from src.callbacks import CallbackRegistry
from src.config import WORKFLOW_CHANNEL_PREFIX
from src.agents import (
    create_chat_agent,
    AgentDeps,
    mcp_registry,
    AgentConfig,
    agent_config_registry,
)

logger = logging.getLogger(__name__)


def deserialize_history(history_json: list[dict[str, Any]] | None) -> list[ModelMessage]:
    if not history_json:
        return []
    return ModelMessagesTypeAdapter.validate_python(history_json)


def serialize_history(messages: list[ModelMessage]) -> list[dict[str, Any]]:
    return to_jsonable_python(messages)


class TaskManager:
    def __init__(self):
        self._tasks: dict[str, asyncio.Task] = {}

    async def run_agent(
        self,
        workflow_run_id: str,
        user_message: str,
        context: dict[str, Any],
        pubsub: PubSubService,
        callback_registry: CallbackRegistry,
        agent_config: str | AgentConfig | None = None,
        history: list[dict[str, Any]] | None = None,
    ) -> None:
        if workflow_run_id in self._tasks:
            old_task = self._tasks[workflow_run_id]
            if not old_task.done():
                logger.warning(f"Cancelling existing task for {workflow_run_id}")
                old_task.cancel()

        config = self._resolve_config(agent_config)
        message_history = deserialize_history(history)

        task = asyncio.create_task(
            self._run_agent_task(
                workflow_run_id,
                user_message,
                context,
                pubsub,
                callback_registry,
                config,
                message_history,
            )
        )
        self._tasks[workflow_run_id] = task

    def _resolve_config(self, agent_config: str | AgentConfig | None) -> AgentConfig:
        if agent_config is None:
            return agent_config_registry.get("default") or AgentConfig(name="default")
        if isinstance(agent_config, str):
            config = agent_config_registry.get(agent_config)
            if config is None:
                raise ValueError(f"Unknown agent config: {agent_config}")
            return config
        return agent_config

    async def _run_agent_task(
        self,
        workflow_run_id: str,
        user_message: str,
        context: dict[str, Any],
        pubsub: PubSubService,
        callback_registry: CallbackRegistry,
        config: AgentConfig,
        message_history: list[ModelMessage],
    ) -> None:
        channel = f"{WORKFLOW_CHANNEL_PREFIX}:{workflow_run_id}"

        deps = AgentDeps(
            workflow_run_id=workflow_run_id,
            channel=channel,
            pubsub=pubsub,
            callback_registry=callback_registry,
            context=context,
        )

        try:
            mcp_servers = config.mcp_servers if config.mcp_servers else None
            async with mcp_registry.connect(mcp_servers) as mcp_toolsets:
                agent = create_chat_agent(
                    model_name=config.model,
                    system_prompt=config.system_prompt,
                    mcp_toolsets=mcp_toolsets if mcp_toolsets else None,
                )

                collected_output: list[str] = []

                async with agent.iter(
                    user_message,
                    deps=deps,
                    message_history=message_history if message_history else None,
                ) as run:
                    async for node in run:
                        if isinstance(node, ModelResponse):
                            for part in node.parts:
                                if isinstance(part, TextPart):
                                    collected_output.append(part.content)
                                    await self._publish_text_delta(
                                        pubsub, channel, workflow_run_id,
                                        part.content,
                                    )
                                elif isinstance(part, ThinkingPart):
                                    await self._publish_thinking(
                                        pubsub, channel, workflow_run_id,
                                        part.content,
                                    )

                all_messages = run.result.all_messages()
                history_json = serialize_history(all_messages)

                result_output = run.result.output
                if isinstance(result_output, str):
                    result_output = {"type": "text", "response": result_output}

                await self._publish_end_of_turn(
                    pubsub, channel, workflow_run_id,
                    data={"output": result_output, "history": history_json},
                )

        except asyncio.CancelledError:
            logger.info(f"Task cancelled for {workflow_run_id}")
            try:
                await self._publish_end_of_turn(
                    pubsub, channel, workflow_run_id,
                    data={
                        "cancelled": True,
                        "output": {"type": "text", "response": "Task cancelled by user."},
                    },
                )
            except Exception:
                pass
            raise
        except Exception as e:
            logger.error(f"Agent error for {workflow_run_id}: {e}", exc_info=True)
            await self._publish_error(
                pubsub,
                channel,
                workflow_run_id,
                message=str(e),
                code="AGENT_ERROR",
            )
        finally:
            self._tasks.pop(workflow_run_id, None)

    def cancel(self, workflow_run_id: str, task_id: str | None = None) -> bool:
        task = self._tasks.get(workflow_run_id)
        if task and not task.done():
            task.cancel()
            return True
        return False

    def cancel_all(self) -> None:
        for task in self._tasks.values():
            if not task.done():
                task.cancel()
        self._tasks.clear()

    async def _publish_thinking(
        self, pubsub: PubSubService, channel: str, workflow_run_id: str,
        content: str,
    ) -> None:
        message = create_message(
            MessageType.THINKING, workflow_run_id,
            ThinkingPayload(content=content),
        )
        await pubsub.publish(channel, message.model_dump())

    async def _publish_text_delta(
        self, pubsub: PubSubService, channel: str, workflow_run_id: str,
        content: str,
    ) -> None:
        message = create_message(
            MessageType.TEXT_DELTA, workflow_run_id,
            TextDeltaPayload(content=content),
        )
        await pubsub.publish(channel, message.model_dump())

    async def _publish_end_of_turn(
        self,
        pubsub: PubSubService,
        channel: str,
        workflow_run_id: str,
        data: dict[str, Any] | None = None,
    ) -> None:
        message = create_message(
            MessageType.END_OF_TURN,
            workflow_run_id,
            EndOfTurnPayload(data=data),
        )
        await pubsub.publish(channel, message.model_dump())

    async def _publish_error(
        self,
        pubsub: PubSubService,
        channel: str,
        workflow_run_id: str,
        message: str,
        code: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        msg = create_message(
            MessageType.ERROR,
            workflow_run_id,
            ErrorPayload(message=message, code=code, details=details),
        )
        await pubsub.publish(channel, msg.model_dump())
