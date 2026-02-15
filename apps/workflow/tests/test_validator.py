import pytest
from src.workflows.validator import WorkflowValidator
from src.workflows.models import (
    WorkflowDefinition,
    SubWorkflowDefinition,
    WorkflowStep,
    AgentDefinition,
    AgentSchema,
    SchemaField,
    StepStrategy,
)


@pytest.fixture
def validator():
    return WorkflowValidator()


def make_agent(**overrides) -> AgentDefinition:
    defaults = {
        "description": "Test agent",
        "system_prompt": "You are a test agent",
    }
    defaults.update(overrides)
    return AgentDefinition(**defaults)


def make_workflow(**overrides) -> WorkflowDefinition:
    defaults = {
        "name": "test-workflow",
        "agents": {"agent1": make_agent()},
        "steps": [WorkflowStep(id="step1", agent="agent1")],
        "output": "${{ steps.step1.output }}",
    }
    defaults.update(overrides)
    return WorkflowDefinition(**defaults)


class TestValidWorkflow:
    def test_minimal_valid_workflow(self, validator):
        wf = make_workflow()
        result = validator.validate(wf)
        assert result.valid

    def test_multi_step_with_dependencies(self, validator):
        wf = make_workflow(
            agents={
                "agent1": make_agent(),
                "agent2": make_agent(description="Agent 2"),
            },
            steps=[
                WorkflowStep(id="step1", agent="agent1"),
                WorkflowStep(id="step2", agent="agent2", **{"needs": ["step1"]}),
            ],
        )
        result = validator.validate(wf)
        assert result.valid


class TestAgentValidation:
    def test_no_agents(self, validator):
        wf = make_workflow(agents={})
        result = validator.validate(wf)
        assert not result.valid
        assert any("At least one agent" in str(e) for e in result.errors)

    def test_missing_description(self, validator):
        wf = make_workflow(agents={"a": make_agent(description="")})
        result = validator.validate(wf)
        assert not result.valid
        assert any("description" in str(e).lower() for e in result.errors)

    def test_missing_system_prompt(self, validator):
        wf = make_workflow(agents={"a": make_agent(system_prompt="")})
        result = validator.validate(wf)
        assert not result.valid
        assert any("system_prompt" in str(e).lower() or "system prompt" in str(e).lower() for e in result.errors)

    def test_can_call_nonexistent_agent(self, validator):
        wf = make_workflow(
            agents={"a": make_agent(can_call_agents=["nonexistent"])}
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("does not exist" in str(e) for e in result.errors)

    def test_agent_calls_itself(self, validator):
        wf = make_workflow(
            agents={"a": make_agent(can_call_agents=["a"])}
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("cannot call itself" in str(e) for e in result.errors)

    def test_valid_can_call_agents(self, validator):
        wf = make_workflow(
            agents={
                "a": make_agent(can_call_agents=["b"]),
                "b": make_agent(description="Agent B"),
            },
            steps=[WorkflowStep(id="step1", agent="a")],
        )
        result = validator.validate(wf)
        assert result.valid


class TestStepValidation:
    def test_no_steps(self, validator):
        wf = make_workflow(steps=[])
        result = validator.validate(wf)
        assert not result.valid
        assert any("At least one step" in str(e) for e in result.errors)

    def test_duplicate_step_ids(self, validator):
        wf = make_workflow(
            steps=[
                WorkflowStep(id="step1", agent="agent1"),
                WorkflowStep(id="step1", agent="agent1"),
            ]
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("Duplicate" in str(e) for e in result.errors)

    def test_nonexistent_agent_reference(self, validator):
        wf = make_workflow(
            steps=[WorkflowStep(id="step1", agent="nonexistent")]
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("does not exist" in str(e) for e in result.errors)

    def test_nonexistent_dependency(self, validator):
        wf = make_workflow(
            steps=[WorkflowStep(id="step1", agent="agent1", **{"needs": ["nonexistent"]})]
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("does not exist in steps" in str(e) for e in result.errors)

    def test_self_dependency(self, validator):
        wf = make_workflow(
            steps=[WorkflowStep(id="step1", agent="agent1", **{"needs": ["step1"]})]
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("cannot depend on itself" in str(e) for e in result.errors)

    def test_step_without_agent_or_sub_workflow(self, validator):
        wf = make_workflow(
            steps=[WorkflowStep(id="step1", agent="")]
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("'agent' or 'sub_workflow'" in str(e) for e in result.errors)


class TestCircularDependency:
    def test_circular_two_steps(self, validator):
        wf = make_workflow(
            agents={
                "a": make_agent(),
                "b": make_agent(description="B"),
            },
            steps=[
                WorkflowStep(id="s1", agent="a", **{"needs": ["s2"]}),
                WorkflowStep(id="s2", agent="b", **{"needs": ["s1"]}),
            ],
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("Circular" in str(e) for e in result.errors)

    def test_circular_three_steps(self, validator):
        wf = make_workflow(
            agents={"a": make_agent()},
            steps=[
                WorkflowStep(id="s1", agent="a", **{"needs": ["s3"]}),
                WorkflowStep(id="s2", agent="a", **{"needs": ["s1"]}),
                WorkflowStep(id="s3", agent="a", **{"needs": ["s2"]}),
            ],
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("Circular" in str(e) for e in result.errors)


class TestExpressionValidation:
    def test_valid_trigger_expression(self, validator):
        wf = make_workflow(
            steps=[WorkflowStep(id="s", agent="agent1", input="${{ trigger.message }}")]
        )
        result = validator.validate(wf)
        assert result.valid

    def test_valid_steps_expression(self, validator):
        wf = make_workflow(
            steps=[WorkflowStep(id="s", agent="agent1", input="${{ steps.s.output }}")]
        )
        result = validator.validate(wf)
        assert result.valid

    def test_valid_context_expression(self, validator):
        wf = make_workflow(
            steps=[WorkflowStep(id="s", agent="agent1", input="${{ context.store_name }}")]
        )
        result = validator.validate(wf)
        assert result.valid

    def test_valid_variables_expression(self, validator):
        wf = make_workflow(
            steps=[WorkflowStep(id="s", agent="agent1", input="${{ variables.mode }}")]
        )
        result = validator.validate(wf)
        assert result.valid

    def test_invalid_root_expression(self, validator):
        wf = make_workflow(
            steps=[WorkflowStep(id="s", agent="agent1", input="${{ badroot.thing }}")]
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("Unknown root" in str(e) for e in result.errors)

    def test_dict_input_expression_validation(self, validator):
        wf = make_workflow(
            steps=[WorkflowStep(id="s", agent="agent1", input={"key": "${{ badroot.x }}"})]
        )
        result = validator.validate(wf)
        assert not result.valid

    def test_output_expression_validation(self, validator):
        wf = make_workflow(output="${{ badroot.value }}")
        result = validator.validate(wf)
        assert not result.valid

    def test_dict_output_validation(self, validator):
        wf = make_workflow(output={"key": "${{ badroot.value }}"})
        result = validator.validate(wf)
        assert not result.valid


class TestSubWorkflowValidation:
    def test_valid_sub_workflow(self, validator):
        sub = SubWorkflowDefinition(
            description="Sub workflow",
            steps=[WorkflowStep(id="ss1", agent="agent1")],
            output="${{ steps.ss1.output }}",
        )
        wf = make_workflow(
            sub_workflows={"my-sub": sub},
            steps=[WorkflowStep(id="step1", sub_workflow="my-sub")],
        )
        result = validator.validate(wf)
        assert result.valid

    def test_invalid_sub_workflow_agent_reference(self, validator):
        sub = SubWorkflowDefinition(
            description="Sub workflow",
            steps=[WorkflowStep(id="ss1", agent="nonexistent")],
            output="${{ steps.ss1.output }}",
        )
        wf = make_workflow(
            sub_workflows={"my-sub": sub},
            steps=[WorkflowStep(id="step1", sub_workflow="my-sub")],
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("sub_workflow" in str(e) for e in result.errors)

    def test_sub_workflow_reference_not_found(self, validator):
        wf = make_workflow(
            steps=[WorkflowStep(id="step1", sub_workflow="nonexistent")],
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("nonexistent" in str(e) for e in result.errors)

    def test_circular_sub_workflow_nesting(self, validator):
        sub_a = SubWorkflowDefinition(
            description="Sub A",
            steps=[WorkflowStep(id="s1", sub_workflow="sub-b")],
            output="${{ steps.s1.output }}",
        )
        sub_b = SubWorkflowDefinition(
            description="Sub B",
            steps=[WorkflowStep(id="s1", sub_workflow="sub-a")],
            output="${{ steps.s1.output }}",
        )
        wf = make_workflow(
            sub_workflows={"sub-a": sub_a, "sub-b": sub_b},
            steps=[WorkflowStep(id="step1", sub_workflow="sub-a")],
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("circular" in str(e).lower() for e in result.errors)


class TestOutputSchemaValidation:
    def test_object_schema_requires_object_output(self, validator):
        wf = make_workflow(
            output="${{ steps.step1.output }}",
            output_schema=AgentSchema(
                type="object",
                properties={"response": SchemaField(type="string")},
            ),
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("must be an object" in str(e) for e in result.errors)

    def test_object_schema_with_object_output_valid(self, validator):
        wf = make_workflow(
            output={"response": "${{ steps.step1.output }}"},
            output_schema=AgentSchema(
                type="object",
                properties={"response": SchemaField(type="string")},
            ),
        )
        result = validator.validate(wf)
        assert result.valid

    def test_object_schema_missing_required_field(self, validator):
        wf = make_workflow(
            output={"other": "${{ steps.step1.output }}"},
            output_schema=AgentSchema(
                type="object",
                properties={
                    "response": SchemaField(type="string"),
                    "other": SchemaField(type="string"),
                },
                required=["response"],
            ),
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("Required output field 'response'" in str(e) for e in result.errors)

    def test_object_schema_extra_key_rejected(self, validator):
        wf = make_workflow(
            output={
                "response": "${{ steps.step1.output }}",
                "unknown_key": "some value",
            },
            output_schema=AgentSchema(
                type="object",
                properties={"response": SchemaField(type="string")},
            ),
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("not defined in the output schema" in str(e) for e in result.errors)

    def test_string_schema_rejects_object_output(self, validator):
        wf = make_workflow(
            output={"key": "value"},
            output_schema=AgentSchema(type="string"),
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("must be a string" in str(e) for e in result.errors)

    def test_string_schema_with_string_output_valid(self, validator):
        wf = make_workflow(
            output="${{ steps.step1.output }}",
            output_schema=AgentSchema(type="string"),
        )
        result = validator.validate(wf)
        assert result.valid

    def test_empty_output_with_schema_fails(self, validator):
        wf = make_workflow(
            output="",
            output_schema=AgentSchema(type="string"),
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("Output is required" in str(e) for e in result.errors)

    def test_sub_workflow_output_schema_enforced(self, validator):
        sub = SubWorkflowDefinition(
            description="Sub",
            steps=[WorkflowStep(id="ss1", agent="agent1")],
            output="${{ steps.ss1.output }}",
            output_schema=AgentSchema(
                type="object",
                properties={"result": SchemaField(type="string")},
            ),
        )
        wf = make_workflow(
            sub_workflows={"my-sub": sub},
            steps=[WorkflowStep(id="step1", sub_workflow="my-sub")],
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("must be an object" in str(e) for e in result.errors)

    def test_sub_workflow_valid_object_output(self, validator):
        sub = SubWorkflowDefinition(
            description="Sub",
            steps=[WorkflowStep(id="ss1", agent="agent1")],
            output={"result": "${{ steps.ss1.output }}"},
            output_schema=AgentSchema(
                type="object",
                properties={"result": SchemaField(type="string")},
            ),
        )
        wf = make_workflow(
            sub_workflows={"my-sub": sub},
            steps=[WorkflowStep(id="step1", sub_workflow="my-sub")],
        )
        result = validator.validate(wf)
        assert result.valid

    def test_no_schema_no_enforcement(self, validator):
        wf = make_workflow(output="${{ steps.step1.output }}")
        result = validator.validate(wf)
        assert result.valid

    def test_no_schema_dict_output_still_valid(self, validator):
        wf = make_workflow(output={"key": "${{ steps.step1.output }}"})
        result = validator.validate(wf)
        assert result.valid


class TestStepInputSchemaValidation:
    def test_valid_input_keys_match_schema(self, validator):
        wf = make_workflow(
            agents={
                "agent1": make_agent(
                    input_schema=AgentSchema(
                        type="object",
                        properties={
                            "message": SchemaField(type="string"),
                            "context": SchemaField(type="string"),
                        },
                        required=["message"],
                    ),
                ),
            },
            steps=[
                WorkflowStep(
                    id="step1",
                    agent="agent1",
                    input={"message": "${{ trigger.message }}", "context": "extra"},
                ),
            ],
        )
        result = validator.validate(wf)
        assert result.valid

    def test_extra_input_key_rejected(self, validator):
        wf = make_workflow(
            agents={
                "agent1": make_agent(
                    input_schema=AgentSchema(
                        type="object",
                        properties={"message": SchemaField(type="string")},
                    ),
                ),
            },
            steps=[
                WorkflowStep(
                    id="step1",
                    agent="agent1",
                    input={"message": "hello", "unknown": "bad"},
                ),
            ],
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("not defined in the input schema" in str(e) for e in result.errors)

    def test_missing_required_input_key(self, validator):
        wf = make_workflow(
            agents={
                "agent1": make_agent(
                    input_schema=AgentSchema(
                        type="object",
                        properties={
                            "message": SchemaField(type="string"),
                            "priority": SchemaField(type="string"),
                        },
                        required=["message", "priority"],
                    ),
                ),
            },
            steps=[
                WorkflowStep(
                    id="step1",
                    agent="agent1",
                    input={"message": "hello"},
                ),
            ],
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("Required input field 'priority'" in str(e) for e in result.errors)

    def test_string_input_skips_schema_check(self, validator):
        wf = make_workflow(
            agents={
                "agent1": make_agent(
                    input_schema=AgentSchema(
                        type="object",
                        properties={"message": SchemaField(type="string")},
                        required=["message"],
                    ),
                ),
            },
            steps=[
                WorkflowStep(id="step1", agent="agent1", input="${{ trigger.message }}"),
            ],
        )
        result = validator.validate(wf)
        assert result.valid

    def test_sub_workflow_input_schema_validated(self, validator):
        sub = SubWorkflowDefinition(
            description="Sub",
            steps=[WorkflowStep(id="ss1", agent="agent1")],
            output="${{ steps.ss1.output }}",
            input_schema=AgentSchema(
                type="object",
                properties={"query": SchemaField(type="string")},
                required=["query"],
            ),
        )
        wf = make_workflow(
            sub_workflows={"my-sub": sub},
            steps=[
                WorkflowStep(
                    id="step1",
                    sub_workflow="my-sub",
                    input={"wrong_key": "value"},
                ),
            ],
        )
        result = validator.validate(wf)
        assert not result.valid
        assert any("not defined in the input schema" in str(e) for e in result.errors)
        assert any("Required input field 'query'" in str(e) for e in result.errors)


class TestValidationResult:
    def test_str_valid(self, validator):
        wf = make_workflow()
        result = validator.validate(wf)
        assert "valid" in str(result).lower()

    def test_str_invalid(self, validator):
        wf = make_workflow(agents={})
        result = validator.validate(wf)
        output = str(result)
        assert "failed" in output.lower()
        assert "error" in output.lower()
