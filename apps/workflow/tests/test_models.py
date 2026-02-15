import pytest
from src.workflows.models import (
    WorkflowDefinition,
    WorkflowStep,
    WorkflowContext,
    StepResult,
    AgentDefinition,
    AgentSchema,
    SchemaField,
    SharedContext,
    StepStrategy,
    RetryConfig,
    FailureHandler,
    ContextField,
    AgentTemplate,
    StepTemplate,
    WorkflowTemplates,
)


class TestSharedContext:
    def test_set_and_get(self):
        ctx = SharedContext()
        ctx.set("key", "value")
        assert ctx.get("key") == "value"

    def test_get_missing_returns_none(self):
        ctx = SharedContext()
        assert ctx.get("missing") is None

    def test_data_property(self):
        ctx = SharedContext()
        ctx.set("a", 1)
        ctx.set("b", 2)
        assert ctx.data == {"a": 1, "b": 2}


class TestStepResult:
    def test_defaults(self):
        r = StepResult(step_id="s1", status="success")
        assert r.output == ""
        assert r.error is None
        assert r.messages == []

    def test_with_string_output(self):
        r = StepResult(
            step_id="s1",
            status="success",
            output="result",
            messages=[{"role": "user"}],
        )
        assert r.output == "result"

    def test_with_dict_output(self):
        r = StepResult(
            step_id="s1",
            status="success",
            output={"key": "val", "score": 85},
        )
        assert r.output["key"] == "val"
        assert r.output["score"] == 85

    def test_with_list_output(self):
        r = StepResult(
            step_id="s1",
            status="success",
            output=[{"item": "a", "output": "result_a"}],
        )
        assert isinstance(r.output, list)
        assert r.output[0]["item"] == "a"


class TestWorkflowContext:
    def test_defaults(self):
        ctx = WorkflowContext(workflow_id="w1", workflow_run_id="r1")
        assert ctx.trigger == {}
        assert ctx.steps == {}
        assert ctx.variables == {}
        assert isinstance(ctx.shared, SharedContext)

    def test_with_trigger_data(self):
        ctx = WorkflowContext(
            workflow_id="w1",
            workflow_run_id="r1",
            trigger={"message": "hello"},
        )
        assert ctx.trigger["message"] == "hello"


class TestAgentDefinition:
    def test_defaults(self):
        a = AgentDefinition(
            description="Test",
            system_prompt="You are a test",
        )
        assert a.model is None
        assert a.mcp_servers == []
        assert a.can_call_agents == []
        assert a.input_schema.type == "string"
        assert a.output_schema.type == "string"
        assert a.context_reads == []
        assert a.context_writes == {}

    def test_with_context_access(self):
        a = AgentDefinition(
            description="Test",
            system_prompt="You are a test",
            context_reads=["store_name"],
            context_writes={
                "summary": ContextField(type="string", description="Summary"),
            },
        )
        assert "store_name" in a.context_reads
        assert "summary" in a.context_writes


class TestAgentSchema:
    def test_simple_string_schema(self):
        s = AgentSchema(type="string", description="Input")
        assert s.type == "string"
        assert s.properties == {}
        assert s.required == []
        assert s.items is None

    def test_object_schema_with_properties(self):
        s = AgentSchema(
            type="object",
            description="Output",
            properties={
                "score": SchemaField(type="number", description="Score"),
            },
            required=["score"],
        )
        assert s.type == "object"
        assert "score" in s.properties
        assert "score" in s.required


class TestWorkflowStep:
    def test_defaults(self):
        s = WorkflowStep(id="s1", agent="a1")
        assert s.input == "${{ trigger.message }}"
        assert s.condition is None
        assert s.depends_on == []
        assert s.strategy is None
        assert s.timeout is None
        assert s.continue_on_error is False
        assert s.retry is None
        assert s.on_failure is None
        assert s.sub_workflow == ""

    def test_with_all_fields(self):
        s = WorkflowStep(
            id="s1",
            agent="a1",
            input="custom input",
            timeout=60,
            continue_on_error=True,
            retry=RetryConfig(max_attempts=3, backoff="exponential", delay_seconds=2.0),
            on_failure=FailureHandler(message="Step failed"),
        )
        assert s.timeout == 60
        assert s.continue_on_error is True
        assert s.retry.max_attempts == 3
        assert s.retry.backoff == "exponential"
        assert s.on_failure.message == "Step failed"

    def test_needs_alias(self):
        s = WorkflowStep(id="s1", agent="a1", **{"needs": ["s0"]})
        assert s.depends_on == ["s0"]

    def test_if_alias(self):
        s = WorkflowStep(id="s1", agent="a1", **{"if": "${{ trigger.message }}"})
        assert s.condition == "${{ trigger.message }}"


class TestStepStrategy:
    def test_parallel(self):
        s = StepStrategy(type="parallel", items=["a", "b", "c"])
        assert s.type == "parallel"
        assert len(s.items) == 3

    def test_for_each(self):
        s = StepStrategy(type="for_each", items=["x", "y"])
        assert s.type == "for_each"

    def test_matrix(self):
        s = StepStrategy(type="matrix", matrix={"os": ["linux", "mac"], "py": ["3.11", "3.12"]})
        assert s.type == "matrix"
        assert len(s.matrix["os"]) == 2


class TestRetryConfig:
    def test_defaults(self):
        r = RetryConfig()
        assert r.max_attempts == 1
        assert r.backoff == "fixed"
        assert r.delay_seconds == 1.0


class TestFailureHandler:
    def test_message_only(self):
        f = FailureHandler(message="Something went wrong")
        assert f.agent is None
        assert f.message == "Something went wrong"

    def test_agent_only(self):
        f = FailureHandler(agent="error_handler")
        assert f.agent == "error_handler"


class TestWorkflowDefinition:
    def test_minimal(self):
        wf = WorkflowDefinition(
            name="test",
            agents={"a1": AgentDefinition(description="Test", system_prompt="sys")},
            steps=[WorkflowStep(id="s1", agent="a1")],
            output="${{ steps.s1.output }}",
        )
        assert wf.name == "test"
        assert wf.fail_fast is False
        assert wf.variables == {}
        assert wf.on_failure is None

    def test_with_variables(self):
        wf = WorkflowDefinition(
            name="test",
            agents={"a1": AgentDefinition(description="Test", system_prompt="sys")},
            steps=[WorkflowStep(id="s1", agent="a1")],
            output="${{ steps.s1.output }}",
            variables={"mode": "test", "count": 5},
        )
        assert wf.variables["mode"] == "test"
        assert wf.variables["count"] == 5


class TestTemplates:
    def test_agent_template(self):
        t = AgentTemplate(
            description="Template agent",
            system_prompt="You are a template",
        )
        assert t.model is None
        assert t.mcp_servers == []

    def test_step_template(self):
        t = StepTemplate(agent="a1", input="custom")
        assert t.agent == "a1"
        assert t.input == "custom"

    def test_workflow_templates(self):
        wt = WorkflowTemplates(
            agents={"tpl_agent": AgentTemplate(description="T", system_prompt="S")},
            steps={"tpl_step": StepTemplate(agent="a1")},
        )
        assert "tpl_agent" in wt.agents
        assert "tpl_step" in wt.steps
