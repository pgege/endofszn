import logging
from typing import Any
from copy import deepcopy

from .models import (
    WorkflowDefinition,
    AgentDefinition,
    WorkflowStep,
    WorkflowTemplates,
)

logger = logging.getLogger(__name__)


class TemplateResolver:
    def __init__(self, templates: WorkflowTemplates | None = None):
        self._templates = templates or WorkflowTemplates()

    def resolve(self, workflow: WorkflowDefinition) -> WorkflowDefinition:
        resolved_agents: dict[str, AgentDefinition] = {}
        for name, agent in workflow.agents.items():
            resolved_agents[name] = self._resolve_agent(name, agent)

        resolved_steps: list[WorkflowStep] = []
        for step in workflow.steps:
            resolved_steps.append(self._resolve_step(step))

        return WorkflowDefinition(
            name=workflow.name,
            description=workflow.description,
            triggers=workflow.triggers,
            agents=resolved_agents,
            steps=resolved_steps,
            output=workflow.output,
            fail_fast=workflow.fail_fast,
            on_failure=workflow.on_failure,
        )

    def _resolve_agent(self, name: str, agent: AgentDefinition) -> AgentDefinition:
        if not agent.description and name in self._templates.agents:
            template = self._templates.agents[name]
            merged = AgentDefinition(
                description=agent.description or template.description,
                system_prompt=agent.system_prompt or template.system_prompt,
                model=agent.model or template.model,
                mcp_servers=agent.mcp_servers or template.mcp_servers,
                can_call_agents=agent.can_call_agents or template.can_call_agents,
                input_schema=agent.input_schema if agent.input_schema else template.input_schema,
                output_schema=agent.output_schema if agent.output_schema else template.output_schema,
                context_reads=agent.context_reads or template.context_reads,
                context_writes=agent.context_writes or template.context_writes,
            )
            return merged
        return agent

    def _resolve_step(self, step: WorkflowStep) -> WorkflowStep:
        if step.id in self._templates.steps:
            template = self._templates.steps[step.id]
            return WorkflowStep(
                id=step.id,
                agent=step.agent or template.agent,
                input=step.input if step.input != "${{ trigger.message }}" else template.input,
                condition=step.condition or template.condition,
                depends_on=step.depends_on,
                strategy=step.strategy or template.strategy,
                timeout=step.timeout or template.timeout,
                continue_on_error=step.continue_on_error or template.continue_on_error,
                retry=step.retry or template.retry,
                on_failure=step.on_failure or template.on_failure,
            )
        return step
