import pytest
from src.workflows.executor import WorkflowExecutor
from src.workflows.models import WorkflowStep


@pytest.fixture
def executor():
    return WorkflowExecutor()


class TestBuildExecutionOrder:
    def test_single_step(self, executor):
        steps = [WorkflowStep(id="s1", agent="a")]
        order = executor._build_execution_order(steps)
        assert order == [["s1"]]

    def test_independent_steps_in_single_batch(self, executor):
        steps = [
            WorkflowStep(id="s1", agent="a"),
            WorkflowStep(id="s2", agent="a"),
            WorkflowStep(id="s3", agent="a"),
        ]
        order = executor._build_execution_order(steps)
        assert len(order) == 1
        assert set(order[0]) == {"s1", "s2", "s3"}

    def test_linear_chain(self, executor):
        steps = [
            WorkflowStep(id="s1", agent="a"),
            WorkflowStep(id="s2", agent="a", **{"needs": ["s1"]}),
            WorkflowStep(id="s3", agent="a", **{"needs": ["s2"]}),
        ]
        order = executor._build_execution_order(steps)
        assert len(order) == 3
        assert order[0] == ["s1"]
        assert order[1] == ["s2"]
        assert order[2] == ["s3"]

    def test_diamond_dependency(self, executor):
        steps = [
            WorkflowStep(id="s1", agent="a"),
            WorkflowStep(id="s2", agent="a", **{"needs": ["s1"]}),
            WorkflowStep(id="s3", agent="a", **{"needs": ["s1"]}),
            WorkflowStep(id="s4", agent="a", **{"needs": ["s2", "s3"]}),
        ]
        order = executor._build_execution_order(steps)
        assert len(order) == 3
        assert order[0] == ["s1"]
        assert set(order[1]) == {"s2", "s3"}
        assert order[2] == ["s4"]

    def test_circular_dependency_raises(self, executor):
        steps = [
            WorkflowStep(id="s1", agent="a", **{"needs": ["s2"]}),
            WorkflowStep(id="s2", agent="a", **{"needs": ["s1"]}),
        ]
        with pytest.raises(ValueError, match="Circular dependency"):
            executor._build_execution_order(steps)

    def test_partial_dependencies(self, executor):
        steps = [
            WorkflowStep(id="s1", agent="a"),
            WorkflowStep(id="s2", agent="a"),
            WorkflowStep(id="s3", agent="a", **{"needs": ["s1"]}),
        ]
        order = executor._build_execution_order(steps)
        assert len(order) == 2
        assert set(order[0]) == {"s1", "s2"}
        assert order[1] == ["s3"]
