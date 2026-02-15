import json
import logging
from typing import Any

from pydantic_ai import RunContext
from pydantic_ai.tools import Tool

from .models import AgentDefinition, SharedContext, ContextField
from src.agents import AgentDeps

logger = logging.getLogger(__name__)


def create_context_tools(
    agent_def: AgentDefinition,
    shared_context: SharedContext,
) -> list[Tool[AgentDeps]]:
    tools: list[Tool[AgentDeps]] = []

    if agent_def.context_reads:
        tool = _create_read_context_tool(agent_def.context_reads, shared_context)
        tools.append(tool)

    if agent_def.context_writes:
        tool = _create_write_context_tool(agent_def.context_writes, shared_context)
        tools.append(tool)

    return tools


def _create_read_context_tool(
    allowed_keys: list[str],
    shared_context: SharedContext,
) -> Tool[AgentDeps]:
    async def read_context(ctx: RunContext[AgentDeps], key: str) -> str:
        """Read a value from shared context."""
        if key not in allowed_keys:
            return json.dumps({"error": f"Not allowed to read key: {key}", "allowed": allowed_keys})

        value = shared_context.get(key)
        if value is None:
            return json.dumps({"error": f"Key not found: {key}"})

        return json.dumps({"key": key, "value": value})

    return Tool(
        function=read_context,
        name="read_context",
        description=f"Read a value from shared context. Allowed keys: {', '.join(allowed_keys)}",
        takes_ctx=True,
    )


def _create_write_context_tool(
    allowed_fields: dict[str, ContextField],
    shared_context: SharedContext,
) -> Tool[AgentDeps]:
    field_descriptions = []
    for key, field in allowed_fields.items():
        desc = f"- {key} ({field.type})"
        if field.description:
            desc += f": {field.description}"
        field_descriptions.append(desc)

    async def write_context(ctx: RunContext[AgentDeps], key: str, value: str) -> str:
        """Write a value to shared context. Value should be JSON-encoded."""
        if key not in allowed_fields:
            return json.dumps({
                "error": f"Not allowed to write key: {key}",
                "allowed": list(allowed_fields.keys())
            })

        field_def = allowed_fields[key]

        try:
            parsed_value = json.loads(value)
        except json.JSONDecodeError:
            if field_def.type == "string":
                parsed_value = value
            elif field_def.type == "number":
                try:
                    parsed_value = float(value)
                except ValueError:
                    return json.dumps({"error": f"Invalid number: {value}"})
            elif field_def.type == "boolean":
                parsed_value = value.lower() in ("true", "1", "yes")
            else:
                return json.dumps({"error": f"Invalid JSON for type {field_def.type}: {value}"})

        if not _validate_type(parsed_value, field_def.type):
            return json.dumps({
                "error": f"Type mismatch: expected {field_def.type}, got {type(parsed_value).__name__}"
            })

        shared_context.set(key, parsed_value, field_def)
        logger.info(f"Context set: {key} = {parsed_value}")

        return json.dumps({"success": True, "key": key, "value": parsed_value})

    return Tool(
        function=write_context,
        name="write_context",
        description=f"Write a value to shared context.\n\nAllowed fields:\n" + "\n".join(field_descriptions),
        takes_ctx=True,
    )


def _validate_type(value: Any, expected_type: str) -> bool:
    if expected_type == "string":
        return isinstance(value, str)
    elif expected_type == "number":
        return isinstance(value, (int, float))
    elif expected_type == "boolean":
        return isinstance(value, bool)
    elif expected_type == "array":
        return isinstance(value, list)
    elif expected_type == "object":
        return isinstance(value, dict)
    return True
