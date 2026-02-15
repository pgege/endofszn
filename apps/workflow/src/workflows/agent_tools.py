import json
import logging
from typing import Any

from pydantic_ai import Agent, AgentRunResultEvent, RunContext
from pydantic_ai.models.openrouter import OpenRouterModel, OpenRouterModelSettings
from pydantic_ai.providers.openrouter import OpenRouterProvider
from pydantic_ai.messages import (
    PartStartEvent, PartDeltaEvent,
    ThinkingPart, TextPart, ThinkingPartDelta, TextPartDelta,
)
from pydantic_ai.tools import Tool

from .models import AgentDefinition, AgentSchema, SubWorkflowDefinition
from .attachment_tools import create_attachment_tools
from src.agents import AgentDeps, mcp_registry
from src.config import OPENROUTER_API_KEY, DEFAULT_MODEL
from src.models import MessageType, ThinkingPayload, TextDeltaPayload, create_message

logger = logging.getLogger(__name__)


def create_agent_tools(
    agents: dict[str, AgentDefinition],
    workflow_run_id: str,
) -> list[Tool[AgentDeps]]:
    tools: list[Tool[AgentDeps]] = []

    for agent_name, agent_def in agents.items():
        tool = _create_agent_tool(agent_name, agent_def, workflow_run_id)
        tools.append(tool)

    return tools


def _build_input_prompt(schema: AgentSchema, args: dict[str, Any]) -> str:
    if schema.type == "string":
        return args.get("input", str(args.get("message", "")))

    if schema.type == "object":
        parts = []
        for key in schema.properties:
            if key in args:
                value = args[key]
                if isinstance(value, (dict, list)):
                    value = json.dumps(value)
                parts.append(f"{key}: {value}")
        return "\n".join(parts) if parts else json.dumps(args)

    return json.dumps(args)


async def _run_sub_agent(
    agent_def: AgentDefinition,
    input_text: str,
    ctx: RunContext[AgentDeps],
    workflow_run_id: str,
    agent_name: str,
) -> str:
    logger.info(f"Invoking sub-agent '{agent_name}' for {workflow_run_id}")

    provider = OpenRouterProvider(api_key=OPENROUTER_API_KEY)
    model = OpenRouterModel(agent_def.model or DEFAULT_MODEL, provider=provider)

    pubsub = ctx.deps.pubsub
    channel = ctx.deps.channel

    attachment_tools = create_attachment_tools(
        pubsub=ctx.deps.pubsub,
        channel=ctx.deps.channel,
        workflow_run_id=workflow_run_id,
        callback_registry=ctx.deps.callback_registry,
    )

    mcp_servers = agent_def.mcp_servers if agent_def.mcp_servers else None
    mcp_extra_env = {"WORKFLOW_RUN_ID": workflow_run_id}
    async with mcp_registry.connect(mcp_servers, extra_env=mcp_extra_env) as mcp_toolsets:
        sub_agent: Agent[AgentDeps, str] = Agent(
            model,
            deps_type=AgentDeps,
            output_type=str,
            system_prompt=agent_def.system_prompt,
            tools=attachment_tools,
            toolsets=mcp_toolsets if mcp_toolsets else None,
            retries=3,
            model_settings=OpenRouterModelSettings(
                openrouter_reasoning={"effort": "high"},
            ),
        )

        collected_output: list[str] = []
        result = None

        async for event in sub_agent.run_stream_events(input_text, deps=ctx.deps):
            if isinstance(event, AgentRunResultEvent):
                result = event.result
            elif isinstance(event, PartStartEvent):
                if isinstance(event.part, ThinkingPart) and event.part.content:
                    msg = create_message(
                        MessageType.THINKING, workflow_run_id,
                        ThinkingPayload(content=event.part.content),
                    )
                    await pubsub.publish(channel, msg.model_dump())
                elif isinstance(event.part, TextPart) and event.part.content:
                    collected_output.append(event.part.content)
                    msg = create_message(
                        MessageType.TEXT_DELTA, workflow_run_id,
                        TextDeltaPayload(content=event.part.content),
                    )
                    await pubsub.publish(channel, msg.model_dump())
            elif isinstance(event, PartDeltaEvent):
                if isinstance(event.delta, ThinkingPartDelta) and event.delta.content_delta:
                    msg = create_message(
                        MessageType.THINKING, workflow_run_id,
                        ThinkingPayload(content=event.delta.content_delta),
                    )
                    await pubsub.publish(channel, msg.model_dump())
                elif isinstance(event.delta, TextPartDelta) and event.delta.content_delta:
                    collected_output.append(event.delta.content_delta)
                    msg = create_message(
                        MessageType.TEXT_DELTA, workflow_run_id,
                        TextDeltaPayload(content=event.delta.content_delta),
                    )
                    await pubsub.publish(channel, msg.model_dump())

        output = result.output

        if agent_def.output_schema.type != "string":
            try:
                parsed = json.loads(output)
                return json.dumps(parsed)
            except json.JSONDecodeError:
                pass

        return output


def _build_tool_description(agent_def: AgentDefinition) -> str:
    desc = agent_def.description

    if agent_def.input_schema.type == "object" and agent_def.input_schema.properties:
        param_docs = []
        for prop_name, prop_def in agent_def.input_schema.properties.items():
            prop_type = prop_def.type
            prop_desc = prop_def.description or ""
            req = "(required)" if prop_name in agent_def.input_schema.required else "(optional)"
            param_docs.append(f"  - {prop_name} ({prop_type}) {req}: {prop_desc}")
        if param_docs:
            desc += "\n\nParameters:\n" + "\n".join(param_docs)

    if agent_def.output_schema.type != "string":
        desc += f"\n\nReturns: {agent_def.output_schema.type}"
        if agent_def.output_schema.description:
            desc += f" - {agent_def.output_schema.description}"

    return desc


def _create_agent_tool(
    agent_name: str,
    agent_def: AgentDefinition,
    workflow_run_id: str,
) -> Tool[AgentDeps]:
    tool_name = f"call_{agent_name.replace('-', '_')}"
    description = _build_tool_description(agent_def)
    input_schema = agent_def.input_schema

    if input_schema.type == "object" and input_schema.properties:
        async def invoke_structured(
            ctx: RunContext[AgentDeps],
            **kwargs: Any,
        ) -> str:
            input_prompt = _build_input_prompt(input_schema, kwargs)
            return await _run_sub_agent(
                agent_def, input_prompt, ctx, workflow_run_id, agent_name
            )

        return Tool(
            function=invoke_structured,
            name=tool_name,
            description=description,
            takes_ctx=True,
        )
    else:
        async def invoke_simple(ctx: RunContext[AgentDeps], input: str) -> str:
            return await _run_sub_agent(
                agent_def, input, ctx, workflow_run_id, agent_name
            )

        return Tool(
            function=invoke_simple,
            name=tool_name,
            description=description,
            takes_ctx=True,
        )


def create_sub_workflow_tools(
    sub_workflows: dict[str, SubWorkflowDefinition],
    executor: Any,
    parent_workflow: Any,
    parent_ctx: Any,
    pubsub: Any,
    callback_registry: Any,
    channel: str,
    history_groups: dict,
) -> list[Tool[AgentDeps]]:
    tools: list[Tool[AgentDeps]] = []
    for name, sub_def in sub_workflows.items():
        tool = _create_sub_workflow_tool(
            name, sub_def, executor, parent_workflow, parent_ctx,
            pubsub, callback_registry, channel, history_groups,
        )
        tools.append(tool)
    return tools


def _build_sub_workflow_description(name: str, sub_def: SubWorkflowDefinition) -> str:
    desc = sub_def.description or name

    if sub_def.input_schema and sub_def.input_schema.type == "object" and sub_def.input_schema.properties:
        param_docs = []
        for prop_name, prop_field in sub_def.input_schema.properties.items():
            prop_type = prop_field.type
            prop_desc = prop_field.description or ""
            req = "(required)" if sub_def.input_schema.required and prop_name in sub_def.input_schema.required else "(optional)"
            param_docs.append(f"  - {prop_name} ({prop_type}) {req}: {prop_desc}")
        if param_docs:
            desc += "\n\nParameters:\n" + "\n".join(param_docs)

    if sub_def.output_schema:
        desc += f"\n\nReturns: {sub_def.output_schema.type}"
        if sub_def.output_schema.description:
            desc += f" - {sub_def.output_schema.description}"

    return desc


def _create_sub_workflow_tool(
    name: str,
    sub_def: SubWorkflowDefinition,
    executor: Any,
    parent_workflow: Any,
    parent_ctx: Any,
    pubsub: Any,
    callback_registry: Any,
    channel: str,
    history_groups: dict,
) -> Tool[AgentDeps]:
    from .models import WorkflowStep

    tool_name = f"run_{name.replace('-', '_')}"
    description = _build_sub_workflow_description(name, sub_def)
    input_schema = sub_def.input_schema

    def _serialize_output(output: Any) -> str:
        if isinstance(output, str):
            return output
        import json
        return json.dumps(output)

    if input_schema and input_schema.type == "object" and input_schema.properties:
        async def invoke_structured(ctx: RunContext[AgentDeps], **kwargs: Any) -> str:
            dummy_step = WorkflowStep(id=f"tool-{name}", sub_workflow=name, input=kwargs)
            result = await executor._execute_sub_workflow(
                dummy_step, sub_def, parent_workflow, parent_ctx,
                pubsub, callback_registry, channel, history_groups,
                None,
            )
            return _serialize_output(result.output)
        return Tool(function=invoke_structured, name=tool_name, description=description, takes_ctx=True)
    else:
        async def invoke_simple(ctx: RunContext[AgentDeps], input: str) -> str:
            dummy_step = WorkflowStep(id=f"tool-{name}", sub_workflow=name, input=input)
            result = await executor._execute_sub_workflow(
                dummy_step, sub_def, parent_workflow, parent_ctx,
                pubsub, callback_registry, channel, history_groups,
                None,
            )
            return _serialize_output(result.output)
        return Tool(function=invoke_simple, name=tool_name, description=description, takes_ctx=True)
