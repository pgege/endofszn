import json
import pytest
from src.workflows.schema_validator import (
    validate_input,
    validate_output,
    validate_against_schema,
    SchemaValidationError,
    _type_matches,
)
from src.workflows.models import AgentSchema, SchemaField


class TestStringSchema:
    def test_valid_string(self):
        schema = AgentSchema(type="string", description="A string input")
        validate_input("hello", schema)

    def test_invalid_string(self):
        schema = AgentSchema(type="string", description="A string input")
        with pytest.raises(SchemaValidationError, match="expected string"):
            validate_input(42, schema)


class TestObjectSchema:
    def test_valid_object(self):
        schema = AgentSchema(
            type="object",
            description="An object",
            properties={
                "name": SchemaField(type="string", description="Name"),
                "age": SchemaField(type="number", description="Age"),
            },
            required=["name"],
        )
        validate_input({"name": "Alice", "age": 30}, schema)

    def test_json_string_parsed_as_object(self):
        schema = AgentSchema(
            type="object",
            description="An object",
            properties={"key": SchemaField(type="string", description="Key")},
        )
        validate_input('{"key": "value"}', schema)

    def test_non_json_string_fails(self):
        schema = AgentSchema(type="object", description="An object")
        with pytest.raises(SchemaValidationError, match="non-JSON string"):
            validate_input("not json", schema)

    def test_missing_required_field(self):
        schema = AgentSchema(
            type="object",
            description="An object",
            required=["name"],
        )
        with pytest.raises(SchemaValidationError, match="missing required field 'name'"):
            validate_input({}, schema)

    def test_wrong_property_type(self):
        schema = AgentSchema(
            type="object",
            description="An object",
            properties={
                "count": SchemaField(type="number", description="Count"),
            },
        )
        with pytest.raises(SchemaValidationError, match="expected number"):
            validate_input({"count": "not a number"}, schema)

    def test_enum_validation_pass(self):
        schema = AgentSchema(
            type="object",
            description="An object",
            properties={
                "status": SchemaField(type="string", description="Status", enum=["active", "inactive"]),
            },
        )
        validate_input({"status": "active"}, schema)

    def test_enum_validation_fail(self):
        schema = AgentSchema(
            type="object",
            description="An object",
            properties={
                "status": SchemaField(type="string", description="Status", enum=["active", "inactive"]),
            },
        )
        with pytest.raises(SchemaValidationError, match="not in allowed values"):
            validate_input({"status": "deleted"}, schema)

    def test_non_dict_fails(self):
        schema = AgentSchema(type="object", description="An object")
        with pytest.raises(SchemaValidationError, match="expected object"):
            validate_input(42, schema)

    def test_null_property_passes(self):
        schema = AgentSchema(
            type="object",
            description="An object",
            properties={
                "name": SchemaField(type="string", description="Name"),
            },
        )
        validate_input({"name": None}, schema)


class TestArraySchema:
    def test_valid_array(self):
        schema = AgentSchema(type="array", description="A list")
        validate_input(["a", "b", "c"], schema)

    def test_json_string_parsed_as_array(self):
        schema = AgentSchema(type="array", description="A list")
        validate_input('["a", "b"]', schema)

    def test_non_json_string_fails(self):
        schema = AgentSchema(type="array", description="A list")
        with pytest.raises(SchemaValidationError, match="non-JSON string"):
            validate_input("not json", schema)

    def test_non_list_fails(self):
        schema = AgentSchema(type="array", description="A list")
        with pytest.raises(SchemaValidationError, match="expected array"):
            validate_input(42, schema)


class TestOutputValidation:
    def test_validate_output_string(self):
        schema = AgentSchema(type="string", description="Output")
        validate_output("result", schema)

    def test_validate_output_object(self):
        schema = AgentSchema(
            type="object",
            description="Output",
            required=["result"],
        )
        validate_output({"result": "ok"}, schema)


class TestTypeMatches:
    def test_string_match(self):
        assert _type_matches("hello", "string") is True
        assert _type_matches(42, "string") is False

    def test_number_match(self):
        assert _type_matches(42, "number") is True
        assert _type_matches(3.14, "number") is True
        assert _type_matches("42", "number") is False

    def test_boolean_not_number(self):
        assert _type_matches(True, "number") is False

    def test_boolean_match(self):
        assert _type_matches(True, "boolean") is True
        assert _type_matches(False, "boolean") is True
        assert _type_matches(1, "boolean") is False

    def test_array_match(self):
        assert _type_matches([1, 2], "array") is True
        assert _type_matches("not a list", "array") is False

    def test_object_match(self):
        assert _type_matches({"a": 1}, "object") is True
        assert _type_matches("not a dict", "object") is False

    def test_none_always_matches(self):
        assert _type_matches(None, "string") is True
        assert _type_matches(None, "number") is True

    def test_unknown_type_always_matches(self):
        assert _type_matches("anything", "custom_type") is True
