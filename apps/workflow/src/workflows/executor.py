import asyncio
import json
import logging
import time
from datetime import datetime, timezone
from typing import Any, Union

from pydantic_ai import Agent, AgentRunResultEvent, ModelMessagesTypeAdapter, RunContext
from pydantic_ai.models.openrouter import OpenRouterModel, OpenRouterModelSettings
from pydantic_ai.providers.openrouter import OpenRouterProvider
from pydantic_ai.messages import (
    ModelMessage, PartStartEvent, PartDeltaEvent,
    ThinkingPart, TextPart, ThinkingPartDelta, TextPartDelta,
)
from pydantic_core import to_jsonable_python

from .models import (
    WorkflowDefinition,
    SubWorkflowDefinition,
    WorkflowStep,
    WorkflowContext,
    StepResult,
    AgentDefinition,
    AgentSchema,
    SharedContext,
    FailureHandler,
    StepTrace,
    WorkflowTrace,
)
from .expressions import ExpressionEvaluator
from .agent_tools import create_agent_tools, create_sub_workflow_tools
from .attachment_tools import create_attachment_tools
from .context_tools import create_context_tools
from .validator import WorkflowValidator
from .schema_validator import validate_input, validate_against_schema, SchemaValidationError
from src.pubsub import PubSubService
from src.callbacks import CallbackRegistry
from src import config
from src.config import WORKFLOW_CHANNEL_PREFIX, OPENROUTER_API_KEY, DEFAULT_MODEL
from src.agents import AgentDeps, mcp_registry
from src.models import MessageType, ThinkingPayload, TextDeltaPayload, EndOfTurnPayload, create_message

logger = logging.getLogger(__name__)

class WorkflowExecutor:
    def __init__(self):
        self._tasks: dict[str, asyncio.Task] = {}
        self._validator = WorkflowValidator()

    async def run(
        self,
        workflow: WorkflowDefinition,
        workflow_run_id: str,
        trigger_data: dict[str, Any],
        pubsub: PubSubService,
        callback_registry: CallbackRegistry,
    ) -> None:
        if workflow_run_id in self._tasks:
            old_task = self._tasks[workflow_run_id]
            if not old_task.done():
                logger.warning(f"Cancelling existing workflow for {workflow_run_id}")
                old_task.cancel()

        task = asyncio.create_task(
            self._execute_workflow(
                workflow, workflow_run_id, trigger_data, pubsub, callback_registry
            )
        )
        self._tasks[workflow_run_id] = task

    async def _execute_workflow(
        self,
        workflow: WorkflowDefinition,
        workflow_run_id: str,
        trigger_data: dict[str, Any],
        pubsub: PubSubService,
        callback_registry: CallbackRegistry,
    ) -> None:
        channel = f"{WORKFLOW_CHANNEL_PREFIX}:{workflow_run_id}"

        validation = self._validator.validate(workflow)
        if not validation.valid:
            logger.error(f"Workflow validation failed: {validation}")
            await self._publish_event(pubsub, channel, create_message(
                MessageType.ERROR, workflow_run_id, {
                    "message": str(validation),
                    "code": "WORKFLOW_VALIDATION_ERROR",
                },
            ).model_dump())
            self._tasks.pop(workflow_run_id, None)
            return

        initial_context = trigger_data.pop("context", {})
        history_json = trigger_data.pop("history", {})
        history_groups: dict[str, list[ModelMessage]] = {
            group: self._deserialize_history(msgs)
            for group, msgs in history_json.items()
        }

        if workflow.input_schema:
            try:
                trigger_value = trigger_data.get("message", trigger_data) if workflow.input_schema.type == "string" else trigger_data
                validate_against_schema(trigger_value, workflow.input_schema, "workflow input")
            except SchemaValidationError as e:
                logger.warning(f"Workflow input validation warning: {e}")
        
        workflow_start = time.monotonic()
        workflow_started_at = datetime.now(timezone.utc).isoformat()

        ctx = WorkflowContext(
            workflow_id=workflow.name,
            workflow_run_id=workflow_run_id,
            trigger=trigger_data,
            variables=dict(workflow.variables),
            trace=WorkflowTrace(
                workflow_name=workflow.name,
                workflow_run_id=workflow_run_id,
                started_at=workflow_started_at,
            ),
        )
        
        for key, value in initial_context.items():
            ctx.shared.set(key, value)

        try:
            execution_order = self._build_execution_order(workflow.steps)

            failed_steps: set[str] = set()

            for batch in execution_order:
                steps_to_run: list[str] = []
                for step_id in batch:
                    step = self._get_step(workflow, step_id)
                    failed_deps = [d for d in step.depends_on if d in failed_steps]
                    if failed_deps:
                        logger.info(f"Skipping step {step_id} - dependency failed: {failed_deps}")
                        ctx.steps[step_id] = StepResult(
                            step_id=step_id,
                            status="skipped",
                            error=f"Skipped due to failed dependencies: {', '.join(failed_deps)}",
                        )
                    else:
                        steps_to_run.append(step_id)

                if not steps_to_run:
                    continue

                if len(steps_to_run) == 1:
                    step = self._get_step(workflow, steps_to_run[0])
                    result = await self._execute_step(
                        workflow, step, ctx, pubsub, callback_registry, channel, history_groups
                    )
                    ctx.steps[step.id] = result
                    if result.status == "failure" and not step.continue_on_error:
                        failed_steps.add(step.id)
                        if step.on_failure:
                            await self._handle_failure(
                                step.on_failure, step.id, result.error or "",
                                workflow, ctx, pubsub, callback_registry, channel, history_groups,
                            )
                        if workflow.fail_fast:
                            raise RuntimeError(f"Step '{step.id}' failed (fail_fast=true): {result.error}")
                else:
                    results = await asyncio.gather(*[
                        self._execute_step(
                            workflow,
                            self._get_step(workflow, step_id),
                            ctx,
                            pubsub,
                            callback_registry,
                            channel,
                            history_groups,
                        )
                        for step_id in steps_to_run
                    ])
                    for step_id, result in zip(steps_to_run, results):
                        ctx.steps[step_id] = result
                        step = self._get_step(workflow, step_id)
                        if result.status == "failure" and not step.continue_on_error:
                            failed_steps.add(step_id)
                            if step.on_failure:
                                await self._handle_failure(
                                    step.on_failure, step_id, result.error or "",
                                    workflow, ctx, pubsub, callback_registry, channel, history_groups,
                                )
                            if workflow.fail_fast:
                                raise RuntimeError(f"Step '{step_id}' failed (fail_fast=true): {result.error}")

            all_failed = all(
                r.status == "failure" or r.status == "skipped"
                for r in ctx.steps.values()
            ) if ctx.steps else False

            evaluator = ExpressionEvaluator(self._build_eval_context(ctx))
            final_output = evaluator.evaluate(workflow.output)

            if all_failed or (final_output is None and failed_steps):
                failure_details = "; ".join(
                    f"{sid}: {r.error}" for sid, r in ctx.steps.items() if r.status == "failure"
                )
                raise RuntimeError(f"All steps failed — {failure_details}")

            if workflow.output_schema:
                try:
                    validate_against_schema(final_output, workflow.output_schema, "workflow output")
                except SchemaValidationError as e:
                    raise RuntimeError(f"Workflow output schema violation: {e}")

            if isinstance(final_output, str):
                final_output = {"type": "text", "response": final_output}
            
            workflow_duration = int((time.monotonic() - workflow_start) * 1000)
            ctx.trace.finished_at = datetime.now(timezone.utc).isoformat()
            ctx.trace.duration_ms = workflow_duration
            ctx.trace.status = "success"

            logger.info(
                f"Workflow '{workflow.name}' completed in {workflow_duration}ms "
                f"({len(ctx.steps)} steps, {len(ctx.trace.step_traces)} traces)"
            )

            end_of_turn_event = create_message(
                MessageType.END_OF_TURN, workflow_run_id,
                EndOfTurnPayload(data={
                    "output": final_output,
                    "workflow": workflow.name,
                    "steps": {k: v.model_dump() for k, v in ctx.steps.items()},
                    "history": {
                        group: to_jsonable_python(msgs)
                        for group, msgs in history_groups.items()
                    },
                    "trace": ctx.trace.model_dump(),
                }),
            ).model_dump()
            payload_json = json.dumps(end_of_turn_event)
            payload_size_kb = len(payload_json.encode('utf-8')) / 1024
            logger.info(f"Publishing end_of_turn for {workflow_run_id} ({payload_size_kb:.1f}KB)")
            await self._publish_event(pubsub, channel, end_of_turn_event)
            logger.info(f"Published end_of_turn for {workflow_run_id}")

        except asyncio.CancelledError:
            ctx.trace.status = "cancelled"
            ctx.trace.finished_at = datetime.now(timezone.utc).isoformat()
            ctx.trace.duration_ms = int((time.monotonic() - workflow_start) * 1000)
            logger.info(f"Workflow cancelled for {workflow_run_id}")
            try:
                await self._publish_event(pubsub, channel, create_message(
                    MessageType.END_OF_TURN, workflow_run_id,
                    EndOfTurnPayload(data={
                        "cancelled": True,
                        "output": {"type": "text", "response": "Workflow cancelled by user."},
                    }),
                ).model_dump())
            except Exception:
                pass
            raise
        except Exception as e:
            ctx.trace.status = "failure"
            ctx.trace.finished_at = datetime.now(timezone.utc).isoformat()
            ctx.trace.duration_ms = int((time.monotonic() - workflow_start) * 1000)
            logger.error(f"Workflow error for {workflow_run_id}: {e}", exc_info=True)
            if workflow.on_failure:
                try:
                    await self._handle_failure(
                        workflow.on_failure, "workflow", str(e),
                        workflow, ctx, pubsub, callback_registry, channel, history_groups,
                    )
                except Exception as cleanup_err:
                    logger.error(f"Workflow on_failure handler error: {cleanup_err}")
            await self._publish_event(pubsub, channel, create_message(
                MessageType.ERROR, workflow_run_id, {
                    "message": str(e),
                    "code": "WORKFLOW_ERROR",
                    "data": {
                        "history": {
                            group: to_jsonable_python(msgs)
                            for group, msgs in history_groups.items()
                        },
                    },
                },
            ).model_dump())
        finally:
            self._tasks.pop(workflow_run_id, None)

    async def _execute_step(
        self,
        workflow: WorkflowDefinition,
        step: WorkflowStep,
        ctx: WorkflowContext,
        pubsub: PubSubService,
        callback_registry: CallbackRegistry,
        channel: str,
        history_groups: dict[str, list[ModelMessage]],
    ) -> StepResult:
        step_start = time.monotonic()
        step_started_at = datetime.now(timezone.utc).isoformat()
        evaluator = ExpressionEvaluator(self._build_eval_context(ctx))

        if step.condition and not evaluator.evaluate_condition(step.condition):
            logger.info(f"Skipping step {step.id} - condition not met")
            step_trace = StepTrace(
                step_id=step.id, agent=step.agent, status="skipped",
                started_at=step_started_at,
                finished_at=datetime.now(timezone.utc).isoformat(),
                duration_ms=int((time.monotonic() - step_start) * 1000),
            )
            ctx.trace.step_traces.append(step_trace)
            return StepResult(step_id=step.id, status="skipped")

        if step.sub_workflow:
            sub_def = workflow.sub_workflows.get(step.sub_workflow)
            if not sub_def:
                return StepResult(
                    step_id=step.id, status="failure",
                    error=f"Sub-workflow not found: {step.sub_workflow}",
                )
            return await self._execute_sub_workflow(
                step, sub_def, workflow, ctx, pubsub, callback_registry,
                channel, history_groups, evaluator,
            )

        agent_def = self._resolve_agent(workflow, step.agent)
        if not agent_def:
            return StepResult(step_id=step.id, status="failure", error=f"Agent not found: {step.agent}")

        group = agent_def.history_group
        message_history = history_groups.get(group, []) if group else None

        resolved_input = evaluator.evaluate(step.input)
        resolved_input = self._format_input(resolved_input, agent_def)

        max_attempts = step.retry.max_attempts if step.retry else 1
        delay = step.retry.delay_seconds if step.retry else 1.0
        backoff = step.retry.backoff if step.retry else "fixed"
        last_error: str | None = None

        for attempt in range(1, max_attempts + 1):
            if attempt > 1:
                logger.info(f"Retrying step {step.id} (attempt {attempt}/{max_attempts})")
                await asyncio.sleep(delay)
                if backoff == "exponential":
                    delay *= 2

            try:
                logger.info(f"Starting step {step.id} with agent {step.agent} (attempt={attempt})")

                if step.strategy and step.strategy.type == "parallel":
                    strategy_items = step.strategy.items
                    if isinstance(strategy_items, str) and "${{" in strategy_items:
                        resolved = evaluator.evaluate(strategy_items)
                        if isinstance(resolved, list):
                            strategy_items = resolved
                        else:
                            strategy_items = [resolved]
                    
                    results = await asyncio.gather(*[
                        self._run_agent(
                            agent_def,
                            f"{resolved_input}\n\nSubtask: {item}",
                            ctx,
                            workflow,
                            pubsub,
                            callback_registry,
                            channel,
                            step.id,
                            message_history=message_history,
                            history_groups=history_groups,
                            step_attachments=step.attachments,
                        )
                        for item in strategy_items
                    ])
                    all_messages = []
                    for r in results:
                        all_messages.extend(r["messages"])

                    if group and all_messages:
                        history_groups[group] = self._deserialize_history(all_messages)

                    results_list = [
                        {"item": item, "output": r["output"]}
                        for item, r in zip(strategy_items, results)
                    ]

                    step_duration = int((time.monotonic() - step_start) * 1000)
                    ctx.trace.step_traces.append(StepTrace(
                        step_id=step.id, agent=step.agent, status="success",
                        started_at=step_started_at,
                        finished_at=datetime.now(timezone.utc).isoformat(),
                        duration_ms=step_duration,
                    ))
                    logger.info(f"Step '{step.id}' (parallel) completed in {step_duration}ms")

                    return StepResult(
                        step_id=step.id,
                        status="success",
                        output=results_list,
                        messages=all_messages,
                    )

                if step.strategy and step.strategy.type == "matrix":
                    import itertools
                    matrix = step.strategy.matrix
                    if matrix:
                        keys = list(matrix.keys())
                        value_lists = [matrix[k] for k in keys]
                        combinations = list(itertools.product(*value_lists))

                        async def run_matrix_combo(combo: tuple) -> dict[str, Any]:
                            params = dict(zip(keys, combo))
                            combo_input = resolved_input
                            for k, v in params.items():
                                combo_input += f"\n{k}: {v}"
                            return await self._run_agent(
                                agent_def, combo_input, ctx, workflow,
                                pubsub, callback_registry, channel, step.id,
                                message_history=message_history,
                                history_groups=history_groups,
                                step_attachments=step.attachments,
                            )

                        results = await asyncio.gather(*[run_matrix_combo(c) for c in combinations])
                        all_messages: list[dict] = []
                        for r in results:
                            all_messages.extend(r["messages"])

                        if group and all_messages:
                            history_groups[group] = self._deserialize_history(all_messages)

                        results_list = []
                        for combo, r in zip(combinations, results):
                            params = dict(zip(keys, combo))
                            results_list.append({
                                "params": params,
                                "output": r["output"],
                            })

                        step_duration = int((time.monotonic() - step_start) * 1000)
                        ctx.trace.step_traces.append(StepTrace(
                            step_id=step.id, agent=step.agent, status="success",
                            started_at=step_started_at,
                            finished_at=datetime.now(timezone.utc).isoformat(),
                            duration_ms=step_duration,
                        ))
                        logger.info(f"Step '{step.id}' (matrix) completed in {step_duration}ms")

                        return StepResult(
                            step_id=step.id,
                            status="success",
                            output=results_list,
                            messages=all_messages,
                        )

                if step.strategy and step.strategy.type == "for_each":
                    strategy_items = step.strategy.items
                    if isinstance(strategy_items, str) and "${{" in strategy_items:
                        resolved = evaluator.evaluate(strategy_items)
                        if isinstance(resolved, list):
                            strategy_items = resolved
                        else:
                            strategy_items = [resolved]

                    all_messages: list[dict] = []
                    results_list: list[dict] = []
                    previous_output: str | dict | list = ""
                    iter_history = list(message_history) if message_history else []

                    for item in strategy_items:
                        item_input = f"{resolved_input}\n\nItem: {item}"
                        if previous_output:
                            prev_str = json.dumps(previous_output) if isinstance(previous_output, (dict, list)) else str(previous_output)
                            item_input += f"\n\nPrevious result: {prev_str}"

                        r = await self._run_agent(
                            agent_def,
                            item_input,
                            ctx,
                            workflow,
                            pubsub,
                            callback_registry,
                            channel,
                            step.id,
                            message_history=iter_history if iter_history else None,
                            history_groups=history_groups,
                            step_attachments=step.attachments,
                        )
                        all_messages.extend(r["messages"])
                        results_list.append(
                            {"item": item, "output": r["output"]}
                        )
                        previous_output = r["output"]
                        if group:
                            iter_history = self._deserialize_history(r["messages"])

                    if group and all_messages:
                        history_groups[group] = self._deserialize_history(all_messages)

                    step_duration = int((time.monotonic() - step_start) * 1000)
                    ctx.trace.step_traces.append(StepTrace(
                        step_id=step.id, agent=step.agent, status="success",
                        started_at=step_started_at,
                        finished_at=datetime.now(timezone.utc).isoformat(),
                        duration_ms=step_duration,
                    ))
                    logger.info(f"Step '{step.id}' (for_each) completed in {step_duration}ms")

                    return StepResult(
                        step_id=step.id,
                        status="success",
                        output=results_list,
                        messages=all_messages,
                    )

                result = await self._run_agent(
                    agent_def,
                    resolved_input,
                    ctx,
                    workflow,
                    pubsub,
                    callback_registry,
                    channel,
                    step.id,
                    message_history=message_history,
                    history_groups=history_groups,
                    step_attachments=step.attachments,
                )

                if group and result.get("messages"):
                    history_groups[group] = self._deserialize_history(result["messages"])

                step_duration = int((time.monotonic() - step_start) * 1000)
                step_trace = StepTrace(
                    step_id=step.id, agent=step.agent, status="success",
                    started_at=step_started_at,
                    finished_at=datetime.now(timezone.utc).isoformat(),
                    duration_ms=step_duration, attempt=attempt,
                )
                ctx.trace.step_traces.append(step_trace)
                logger.info(f"Step '{step.id}' completed in {step_duration}ms (attempt {attempt})")

                return StepResult(
                    step_id=step.id,
                    status="success",
                    output=result["output"],
                    messages=result["messages"],
                )

            except Exception as e:
                last_error = str(e)
                logger.error(f"Step {step.id} failed (attempt {attempt}/{max_attempts}): {e}", exc_info=True)

        if group:
            from pydantic_ai.messages import ModelRequest, UserPromptPart
            preserved = list(message_history) if message_history else []
            preserved.append(ModelRequest(parts=[UserPromptPart(content=resolved_input)]))
            history_groups[group] = preserved
            logger.info(f"Preserved {len(preserved)} history entries for group '{group}' after step failure")

        step_duration = int((time.monotonic() - step_start) * 1000)
        step_trace = StepTrace(
            step_id=step.id, agent=step.agent, status="failure",
            started_at=step_started_at,
            finished_at=datetime.now(timezone.utc).isoformat(),
            duration_ms=step_duration, attempt=max_attempts,
            error=last_error,
        )
        ctx.trace.step_traces.append(step_trace)
        logger.info(f"Step '{step.id}' failed after {step_duration}ms ({max_attempts} attempts)")

        return StepResult(step_id=step.id, status="failure", error=last_error)

    async def _run_agent(
        self,
        agent_def: AgentDefinition,
        input_text: str,
        ctx: WorkflowContext,
        workflow: WorkflowDefinition,
        pubsub: PubSubService,
        callback_registry: CallbackRegistry,
        channel: str,
        step_id: str,
        message_history: list[ModelMessage] | None = None,
        history_groups: dict[str, list[ModelMessage]] | None = None,
        step_attachments: bool = False,
    ) -> dict[str, Any]:
        if agent_def.input_schema:
            try:
                validate_input(input_text, agent_def.input_schema)
            except SchemaValidationError as e:
                raise RuntimeError(f"Input schema violation for step '{step_id}': {e}")

        trigger_attachments: list[dict] = []
        if step_attachments:
            trigger_attachments = ctx.trigger.get("attachments", [])
            if trigger_attachments:
                filenames = [a.get("filename", "file") for a in trigger_attachments]
                names_str = ", ".join(filenames)
                input_text = f"{input_text}\n\n[The user attached {len(trigger_attachments)} file(s): {names_str}. Use list_attachments to get their IDs, then upload_product_images to add them to a product.]"
                ctx.trigger["attachments"] = []

        evaluator = ExpressionEvaluator(self._build_eval_context(ctx))
        resolved_system_prompt = evaluator.evaluate(agent_def.system_prompt)

        provider = OpenRouterProvider(api_key=OPENROUTER_API_KEY)
        model = OpenRouterModel(agent_def.model or DEFAULT_MODEL, provider=provider)

        deps = AgentDeps(
            workflow_run_id=ctx.workflow_run_id,
            channel=channel,
            pubsub=pubsub,
            callback_registry=callback_registry,
            context={"step_id": step_id, "workflow_id": ctx.workflow_id},
        )

        all_tools = []

        if agent_def.can_call_agents:
            callable_agents = {
                name: defn
                for name, defn in workflow.agents.items()
                if name in agent_def.can_call_agents
            }
            all_tools.extend(create_agent_tools(callable_agents, ctx.workflow_run_id))

        if agent_def.can_call_workflows and workflow.sub_workflows:
            callable_subs = {
                name: defn
                for name, defn in workflow.sub_workflows.items()
                if name in agent_def.can_call_workflows
            }
            all_tools.extend(create_sub_workflow_tools(
                callable_subs, self, workflow, ctx,
                pubsub, callback_registry, channel,
                history_groups=history_groups if history_groups is not None else {},
            ))

        if agent_def.context_reads or agent_def.context_writes:
            all_tools.extend(create_context_tools(agent_def, ctx.shared))

        if step_attachments:
            all_tools.extend(create_attachment_tools(
                pubsub=pubsub,
                channel=channel,
                workflow_run_id=ctx.workflow_run_id,
                callback_registry=callback_registry,
            ))

        output_type = self._build_output_type(agent_def.output_schema)
        logger.info(f"Agent '{step_id}' output_type={output_type.__name__}, output_retries={agent_def.output_retries}, history_len={len(message_history) if message_history else 0}")

        mcp_servers = agent_def.mcp_servers if agent_def.mcp_servers else []
        mcp_extra_env = {
            "WORKFLOW_RUN_ID": ctx.workflow_run_id,
            "VENDOR_ID": ctx.shared.get("vendor_id", ""),
        }
        async with mcp_registry.connect(mcp_servers, extra_env=mcp_extra_env) as mcp_toolsets:
            all_toolsets = list(mcp_toolsets) if mcp_toolsets else []

            has_tools = bool(all_tools) or bool(all_toolsets)
            if has_tools and output_type is str:
                resolved_system_prompt += "\n\nIMPORTANT: After using any tools, you MUST always provide a final plain text response. Never end your turn with only a tool call."

            agent_kwargs: dict[str, Any] = {
                "model": model,
                "deps_type": AgentDeps,
                "system_prompt": resolved_system_prompt,
                "output_type": output_type,
                "retries": 3,
                "output_retries": agent_def.output_retries,
                "model_settings": OpenRouterModelSettings(
                    openrouter_reasoning={"effort": "high"},
                ),
            }
            if all_toolsets:
                agent_kwargs["toolsets"] = all_toolsets
            if all_tools:
                agent_kwargs["tools"] = all_tools

            agent = Agent(**agent_kwargs)

            collected_output: list[str] = []
            result = None

            async for event in agent.run_stream_events(
                input_text,
                deps=deps,
                message_history=message_history if message_history else None,
            ):
                if isinstance(event, AgentRunResultEvent):
                    result = event.result
                elif isinstance(event, PartStartEvent):
                    if isinstance(event.part, ThinkingPart) and event.part.content:
                        await self._publish_thinking(
                            pubsub, channel,
                            ctx.workflow_run_id, event.part.content,
                            step_id=step_id,
                        )
                    elif isinstance(event.part, TextPart) and event.part.content:
                        collected_output.append(event.part.content)
                        await self._publish_text_delta(
                            pubsub, channel,
                            ctx.workflow_run_id, event.part.content,
                            step_id=step_id,
                        )
                elif isinstance(event, PartDeltaEvent):
                    if isinstance(event.delta, ThinkingPartDelta) and event.delta.content_delta:
                        await self._publish_thinking(
                            pubsub, channel,
                            ctx.workflow_run_id, event.delta.content_delta,
                            step_id=step_id,
                        )
                    elif isinstance(event.delta, TextPartDelta) and event.delta.content_delta:
                        collected_output.append(event.delta.content_delta)
                        await self._publish_text_delta(
                            pubsub, channel,
                            ctx.workflow_run_id, event.delta.content_delta,
                            step_id=step_id,
                        )

            messages = to_jsonable_python(result.all_messages())
            output_value = result.output

            if isinstance(output_value, str):
                output = output_value
            elif hasattr(output_value, "model_dump"):
                output = output_value.model_dump()
            elif isinstance(output_value, (dict, list)):
                output = output_value
            else:
                output = str(output_value)

            return {
                "output": output,
                "messages": messages,
            }

    async def _execute_sub_workflow(
        self,
        step: WorkflowStep,
        sub_def: "SubWorkflowDefinition",
        parent_workflow: WorkflowDefinition,
        parent_ctx: WorkflowContext,
        pubsub: PubSubService,
        callback_registry: CallbackRegistry,
        channel: str,
        history_groups: dict[str, list[ModelMessage]],
        evaluator: ExpressionEvaluator | None,
    ) -> StepResult:
        resolved_input = evaluator.evaluate(step.input) if evaluator else step.input

        if sub_def.input_schema:
            try:
                validate_against_schema(resolved_input, sub_def.input_schema, f"sub-workflow '{step.sub_workflow}' input")
            except SchemaValidationError as e:
                return StepResult(
                    step_id=step.id, status="failure",
                    error=f"Input schema violation: {e}",
                )

        if isinstance(resolved_input, dict):
            sub_trigger = {**resolved_input, "context": parent_ctx.shared.data.copy()}
        else:
            sub_trigger = {
                "message": str(resolved_input),
                "context": parent_ctx.shared.data.copy(),
            }

        sub_ctx = WorkflowContext(
            workflow_id=step.sub_workflow,
            workflow_run_id=parent_ctx.workflow_run_id,
            trigger=sub_trigger,
            variables=dict(sub_def.variables),
        )

        for key, value in parent_ctx.shared.data.items():
            sub_ctx.shared.set(key, value)

        proxy_workflow = WorkflowDefinition(
            name=step.sub_workflow,
            agents=parent_workflow.agents,
            sub_workflows=parent_workflow.sub_workflows,
            steps=sub_def.steps,
            output=sub_def.output,
        )

        try:
            execution_order = self._build_execution_order(sub_def.steps)

            for batch in execution_order:
                for step_id in batch:
                    sub_step = self._get_step(proxy_workflow, step_id)
                    result = await self._execute_step(
                        proxy_workflow, sub_step, sub_ctx, pubsub, callback_registry,
                        channel, history_groups,
                    )
                    sub_ctx.steps[step_id] = result

            sub_evaluator = ExpressionEvaluator(self._build_eval_context(sub_ctx))
            final_output = sub_evaluator.evaluate(sub_def.output)

            if sub_def.output_schema:
                try:
                    validate_against_schema(final_output, sub_def.output_schema, f"sub-workflow '{step.sub_workflow}' output")
                except SchemaValidationError as e:
                    return StepResult(
                        step_id=step.id, status="failure",
                        error=f"Output schema violation: {e}",
                    )

            return StepResult(
                step_id=step.id,
                status="success",
                output=final_output,
            )
        except Exception as e:
            logger.error(f"Sub-workflow '{step.sub_workflow}' failed: {e}", exc_info=True)
            return StepResult(step_id=step.id, status="failure", error=str(e))

    async def _handle_failure(
        self,
        handler: FailureHandler,
        source_id: str,
        error: str,
        workflow: WorkflowDefinition,
        ctx: WorkflowContext,
        pubsub: PubSubService,
        callback_registry: CallbackRegistry,
        channel: str,
        history_groups: dict[str, list[ModelMessage]],
    ) -> None:
        if handler.message:
            evaluator = ExpressionEvaluator(self._build_eval_context(ctx))
            resolved_msg = evaluator.evaluate(handler.message)
            await self._publish_event(pubsub, channel, {
                "type": "text_delta",
                "workflow_run_id": ctx.workflow_run_id,
                "payload": {"content": str(resolved_msg)},
            })

        if handler.agent:
            agent_def = self._resolve_agent(workflow, handler.agent)
            if agent_def:
                group = agent_def.history_group
                message_history = history_groups.get(group, []) if group else None
                try:
                    await self._run_agent(
                        agent_def,
                        f"Error in {source_id}: {error}",
                        ctx,
                        workflow,
                        pubsub,
                        callback_registry,
                        channel,
                        f"{source_id}_failure_handler",
                        message_history=message_history,
                        history_groups=history_groups,
                    )
                except Exception as e:
                    logger.error(f"Failure handler agent error: {e}")

    def _deserialize_history(self, history_json: list[dict] | None) -> list[ModelMessage]:
        if not history_json:
            return []
        return ModelMessagesTypeAdapter.validate_python(history_json)

    def _build_output_type(self, schema: AgentSchema | None) -> type:
        if not schema or schema.type == "string":
            logger.debug(f"Output type: str (schema={schema})")
            return str

        logger.info(f"Building structured output type from schema: type={schema.type}, properties={list(schema.properties.keys()) if schema.properties else None}")

        if schema.type == "object" and schema.properties:
            from pydantic import create_model, Field as PydanticField

            type_map = {"string": str, "number": float, "integer": int, "boolean": bool, "array": list, "object": dict}
            fields: dict[str, Any] = {}
            required_fields = set(schema.required or [])
            for name, prop in schema.properties.items():
                py_type = type_map.get(prop.type, str)
                desc = prop.description or ""
                if name in required_fields:
                    fields[name] = (py_type, PydanticField(description=desc))
                else:
                    fields[name] = (py_type | None, PydanticField(default=None, description=desc))
            structured_model = create_model("AgentOutput", **fields)
            return Union[str, structured_model]

        if schema.type == "array":
            return Union[str, list]

        return str

    def _resolve_agent(
        self, workflow: WorkflowDefinition, agent_name: str
    ) -> AgentDefinition | None:
        return workflow.agents.get(agent_name)

    def _format_input(
        self, resolved_input: str | dict[str, Any] | list[Any], agent_def: AgentDefinition
    ) -> str:
        if isinstance(resolved_input, str):
            return resolved_input
        return json.dumps(resolved_input)

    def _get_step(self, workflow: WorkflowDefinition, step_id: str) -> WorkflowStep:
        for step in workflow.steps:
            if step.id == step_id:
                return step
        raise ValueError(f"Step not found: {step_id}")

    def _build_eval_context(self, ctx: WorkflowContext) -> dict[str, Any]:
        return {
            "trigger": ctx.trigger,
            "steps": {
                step_id: {
                    "output": result.output,
                    "status": result.status,
                }
                for step_id, result in ctx.steps.items()
            },
            "context": ctx.shared.data,
            "variables": ctx.variables,
        }

    def _build_execution_order(
        self, steps: list[WorkflowStep]
    ) -> list[list[str]]:
        graph: dict[str, set[str]] = {s.id: set(s.depends_on) for s in steps}
        batches: list[list[str]] = []
        completed: set[str] = set()

        while len(completed) < len(steps):
            batch = [
                step_id
                for step_id, deps in graph.items()
                if step_id not in completed and deps <= completed
            ]
            if not batch:
                remaining = set(graph.keys()) - completed
                raise ValueError(f"Circular dependency detected: {remaining}")
            batches.append(batch)
            completed.update(batch)

        return batches

    async def _publish_thinking(
        self, pubsub: PubSubService, channel: str, workflow_run_id: str,
        content: str, step_id: str | None = None,
    ) -> None:
        message = create_message(
            MessageType.THINKING, workflow_run_id,
            ThinkingPayload(content=content, step_id=step_id),
        )
        await pubsub.publish(channel, message.model_dump())

    async def _publish_text_delta(
        self, pubsub: PubSubService, channel: str, workflow_run_id: str,
        content: str, step_id: str | None = None,
    ) -> None:
        message = create_message(
            MessageType.TEXT_DELTA, workflow_run_id,
            TextDeltaPayload(content=content, step_id=step_id),
        )
        await pubsub.publish(channel, message.model_dump())

    async def _publish_event(
        self, pubsub: PubSubService, channel: str, event: dict[str, Any]
    ) -> None:
        await pubsub.publish(channel, event)

    def cancel(self, workflow_run_id: str) -> bool:
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
