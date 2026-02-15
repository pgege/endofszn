import json
import logging
from typing import Any

from .models import AgentSchema

logger = logging.getLogger(__name__)


class SchemaValidationError(Exception):
    pass


def validate_against_schema(value: Any, schema: AgentSchema, label: str) -> None:
    if schema.type == "string":
        if not isinstance(value, str):
            raise SchemaValidationError(
                f"{label}: expected string, got {type(value).__name__}"
            )
        return

    if schema.type == "object":
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                raise SchemaValidationError(
                    f"{label}: expected JSON object, got non-JSON string"
                )

        if not isinstance(value, dict):
            raise SchemaValidationError(
                f"{label}: expected object, got {type(value).__name__}"
            )

        if schema.required:
            for req in schema.required:
                if req not in value:
                    raise SchemaValidationError(
                        f"{label}: missing required field '{req}'"
                    )

        if schema.properties:
            for prop_name, prop_schema in schema.properties.items():
                if prop_name in value:
                    prop_val = value[prop_name]
                    expected_type = prop_schema.type
                    if not _type_matches(prop_val, expected_type):
                        raise SchemaValidationError(
                            f"{label}.{prop_name}: expected {expected_type}, got {type(prop_val).__name__}"
                        )
                    if prop_schema.enum and prop_val not in prop_schema.enum:
                        raise SchemaValidationError(
                            f"{label}.{prop_name}: value '{prop_val}' not in allowed values {prop_schema.enum}"
                        )
        return

    if schema.type == "array":
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                raise SchemaValidationError(
                    f"{label}: expected JSON array, got non-JSON string"
                )

        if not isinstance(value, list):
            raise SchemaValidationError(
                f"{label}: expected array, got {type(value).__name__}"
            )
        return


def validate_input(value: Any, schema: AgentSchema) -> None:
    validate_against_schema(value, schema, "input")


def validate_output(value: Any, schema: AgentSchema) -> None:
    validate_against_schema(value, schema, "output")


def _type_matches(value: Any, expected_type: str) -> bool:
    if value is None:
        return True

    type_map = {
        "string": str,
        "number": (int, float),
        "boolean": bool,
        "array": list,
        "object": dict,
    }

    expected = type_map.get(expected_type)
    if expected is None:
        return True

    if expected_type == "number" and isinstance(value, bool):
        return False

    return isinstance(value, expected)
