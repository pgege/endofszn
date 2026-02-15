import re
import logging
from typing import Any

from .models import WorkflowDefinition, WorkflowStep, SubWorkflowDefinition

logger = logging.getLogger(__name__)

EXPRESSION_PATTERN = re.compile(r'\$\{\{\s*(.+?)\s*\}\}')


class ValidationError:
    def __init__(self, path: str, message: str):
        self.path = path
        self.message = message

    def __str__(self) -> str:
        return f"{self.path}: {self.message}"


class ValidationResult:
    def __init__(self):
        self.errors: list[ValidationError] = []

    @property
    def valid(self) -> bool:
        return len(self.errors) == 0

    def add(self, path: str, message: str) -> None:
        self.errors.append(ValidationError(path, message))

    def __str__(self) -> str:
        if self.valid:
            return "Workflow definition is valid"
        lines = [f"Workflow validation failed with {len(self.errors)} error(s):"]
        for err in self.errors:
            lines.append(f"  - {err}")
        return "\n".join(lines)


class WorkflowValidator:
    def validate(self, workflow: WorkflowDefinition) -> ValidationResult:
        result = ValidationResult()

        self._validate_agents(workflow, result)
        self._validate_sub_workflows(workflow, result)
        self._validate_steps(workflow, result)
        self._validate_output(workflow, result)

        return result

    def _validate_agents(self, workflow: WorkflowDefinition, result: ValidationResult) -> None:
        if not workflow.agents:
            result.add("agents", "At least one agent must be defined")
            return

        for name, agent in workflow.agents.items():
            if not agent.description:
                result.add(f"agents.{name}.description", "Description is required")
            if not agent.system_prompt:
                result.add(f"agents.{name}.system_prompt", "System prompt is required")

            for ref in agent.can_call_agents:
                if ref not in workflow.agents:
                    result.add(
                        f"agents.{name}.can_call_agents",
                        f"Referenced agent '{ref}' does not exist",
                    )
                if ref == name:
                    result.add(
                        f"agents.{name}.can_call_agents",
                        f"Agent cannot call itself",
                    )

            for ref in agent.can_call_workflows:
                if ref not in workflow.sub_workflows:
                    result.add(
                        f"agents.{name}.can_call_workflows",
                        f"Referenced sub-workflow '{ref}' does not exist",
                    )

    def _validate_sub_workflows(self, workflow: WorkflowDefinition, result: ValidationResult) -> None:
        for name, sub_def in workflow.sub_workflows.items():
            prefix = f"sub_workflows.{name}"

            if not sub_def.steps:
                result.add(f"{prefix}.steps", "At least one step is required")
                continue

            step_ids = {s.id for s in sub_def.steps}
            seen_ids: set[str] = set()

            for step in sub_def.steps:
                if step.id in seen_ids:
                    result.add(f"{prefix}.steps.{step.id}", f"Duplicate step ID '{step.id}'")
                seen_ids.add(step.id)

                if step.sub_workflow:
                    if step.sub_workflow not in workflow.sub_workflows:
                        result.add(
                            f"{prefix}.steps.{step.id}.sub_workflow",
                            f"Referenced sub-workflow '{step.sub_workflow}' does not exist",
                        )
                elif step.agent:
                    if step.agent not in workflow.agents:
                        result.add(
                            f"{prefix}.steps.{step.id}.agent",
                            f"Referenced agent '{step.agent}' does not exist in parent agents",
                        )
                else:
                    result.add(
                        f"{prefix}.steps.{step.id}",
                        "Step must have either 'agent' or 'sub_workflow'",
                    )

                for dep in step.depends_on:
                    if dep not in step_ids:
                        result.add(
                            f"{prefix}.steps.{step.id}.needs",
                            f"Dependency '{dep}' does not exist in sub-workflow steps",
                        )

            self._validate_no_circular_deps(sub_def.steps, result, prefix)

        self._validate_no_circular_sub_workflows(workflow, result)

    def _validate_no_circular_sub_workflows(self, workflow: WorkflowDefinition, result: ValidationResult) -> None:
        graph: dict[str, set[str]] = {}
        for name, sub_def in workflow.sub_workflows.items():
            refs: set[str] = set()
            for step in sub_def.steps:
                if step.sub_workflow:
                    refs.add(step.sub_workflow)
            graph[name] = refs

        visited: set[str] = set()
        rec_stack: set[str] = set()

        def has_cycle(node: str) -> bool:
            visited.add(node)
            rec_stack.add(node)
            for dep in graph.get(node, set()):
                if dep not in visited:
                    if has_cycle(dep):
                        return True
                elif dep in rec_stack:
                    return True
            rec_stack.discard(node)
            return False

        for name in graph:
            if name not in visited:
                if has_cycle(name):
                    result.add("sub_workflows", f"Circular sub-workflow nesting detected involving '{name}'")
                    return

    def _validate_steps(self, workflow: WorkflowDefinition, result: ValidationResult) -> None:
        if not workflow.steps:
            result.add("steps", "At least one step must be defined")
            return

        step_ids = {s.id for s in workflow.steps}
        seen_ids: set[str] = set()

        for step in workflow.steps:
            if step.id in seen_ids:
                result.add(f"steps.{step.id}", f"Duplicate step ID '{step.id}'")
            seen_ids.add(step.id)

            if step.sub_workflow:
                if step.sub_workflow not in workflow.sub_workflows:
                    result.add(
                        f"steps.{step.id}.sub_workflow",
                        f"Referenced sub-workflow '{step.sub_workflow}' does not exist in sub_workflows",
                    )
            elif step.agent and step.agent not in workflow.agents:
                result.add(
                    f"steps.{step.id}.agent",
                    f"Referenced agent '{step.agent}' does not exist in agents",
                )
            elif not step.agent and not step.sub_workflow:
                result.add(
                    f"steps.{step.id}",
                    "Step must have either 'agent' or 'sub_workflow'",
                )

            for dep in step.depends_on:
                if dep not in step_ids:
                    result.add(
                        f"steps.{step.id}.needs",
                        f"Dependency '{dep}' does not exist in steps",
                    )
                if dep == step.id:
                    result.add(
                        f"steps.{step.id}.needs",
                        "Step cannot depend on itself",
                    )

            if step.condition:
                self._validate_expression(step.condition, f"steps.{step.id}.if", result)

            if isinstance(step.input, str):
                self._validate_expression(step.input, f"steps.{step.id}.input", result)
            elif isinstance(step.input, dict):
                for key, val in step.input.items():
                    if isinstance(val, str):
                        self._validate_expression(val, f"steps.{step.id}.input.{key}", result)

            self._validate_step_input_schema(step, workflow, result)

        self._validate_no_circular_deps(workflow.steps, result)

    def _validate_step_input_schema(
        self, step: WorkflowStep, workflow: WorkflowDefinition, result: ValidationResult
    ) -> None:
        if not isinstance(step.input, dict):
            return

        input_schema = None
        if step.agent and step.agent in workflow.agents:
            input_schema = workflow.agents[step.agent].input_schema
        elif step.sub_workflow and step.sub_workflow in workflow.sub_workflows:
            input_schema = workflow.sub_workflows[step.sub_workflow].input_schema

        if not input_schema:
            return

        schema_props = getattr(input_schema, "properties", None) if not isinstance(input_schema, dict) else input_schema.get("properties")
        schema_required = getattr(input_schema, "required", None) if not isinstance(input_schema, dict) else input_schema.get("required")

        if schema_props:
            for key in step.input:
                if key not in schema_props:
                    result.add(
                        f"steps.{step.id}.input.{key}",
                        f"Input key '{key}' is not defined in the input schema",
                    )

        if schema_required:
            for key in schema_required:
                if key not in step.input:
                    result.add(
                        f"steps.{step.id}.input.{key}",
                        f"Required input field '{key}' is missing",
                    )

    def _validate_output(self, workflow: WorkflowDefinition, result: ValidationResult) -> None:
        self._validate_output_structure(
            workflow.output, workflow.output_schema, "output", result
        )

        for name, sub_def in workflow.sub_workflows.items():
            self._validate_output_structure(
                sub_def.output, sub_def.output_schema, f"sub_workflows.{name}.output", result
            )

    def _validate_output_structure(
        self,
        output: Any,
        schema: Any,
        path: str,
        result: ValidationResult,
    ) -> None:
        if isinstance(output, str):
            self._validate_expression(output, path, result)
        elif isinstance(output, dict):
            for key, val in output.items():
                if isinstance(val, str):
                    self._validate_expression(val, f"{path}.{key}", result)
                elif isinstance(val, dict):
                    self._validate_output_structure(val, None, f"{path}.{key}", result)

        if schema is None:
            return

        schema_type = getattr(schema, "type", None) if not isinstance(schema, dict) else schema.get("type")
        schema_props = getattr(schema, "properties", None) if not isinstance(schema, dict) else schema.get("properties")
        schema_required = getattr(schema, "required", None) if not isinstance(schema, dict) else schema.get("required")

        if not output or (isinstance(output, str) and not output.strip()):
            result.add(path, "Output is required when an output schema is defined")
            return

        if schema_type == "object" and schema_props:
            if not isinstance(output, dict):
                result.add(
                    path,
                    "Output must be an object (JSON) to match output_schema type 'object'. "
                    "Define it as { \"key\": \"${{ expression }}\" }",
                )
                return

            for key in output:
                if key not in schema_props:
                    result.add(
                        f"{path}.{key}",
                        f"Key '{key}' is not defined in the output schema properties",
                    )

            if schema_required:
                for key in schema_required:
                    if key not in output:
                        result.add(
                            f"{path}.{key}",
                            f"Required output field '{key}' is missing",
                        )

        elif schema_type == "string":
            if isinstance(output, dict):
                result.add(
                    path,
                    "Output must be a string expression to match output_schema type 'string'. "
                    "Use ${{ steps.<id>.output }} instead of an object",
                )

        elif schema_type == "array":
            if isinstance(output, dict):
                result.add(
                    path,
                    "Output must resolve to an array to match output_schema type 'array'",
                )

    def _validate_expression(self, template: str, path: str, result: ValidationResult) -> None:
        for match in EXPRESSION_PATTERN.finditer(template):
            expr = match.group(1).strip()
            try:
                self._check_expression_syntax(expr)
            except ValueError as e:
                result.add(path, f"Invalid expression '${{{{ {expr} }}}}': {e}")

    def _check_expression_syntax(self, expr: str) -> None:
        if not expr:
            raise ValueError("Empty expression")

        for op in ["==", "!=", " in ", " && ", " || "]:
            if op in expr:
                return

        if expr.startswith("!"):
            self._check_expression_syntax(expr[1:].strip())
            return

        path = expr.strip()
        if path.startswith("'") or path.startswith('"'):
            return

        valid_roots = {"trigger", "steps", "context", "variables"}
        root = path.split(".")[0].split("[")[0]
        if root not in valid_roots:
            raise ValueError(
                f"Unknown root '{root}'. Valid roots: {', '.join(sorted(valid_roots))}"
            )

    def _validate_no_circular_deps(
        self, steps: list[WorkflowStep], result: ValidationResult, prefix: str = ""
    ) -> None:
        graph: dict[str, set[str]] = {s.id: set(s.depends_on) for s in steps}
        visited: set[str] = set()
        rec_stack: set[str] = set()

        def has_cycle(node: str) -> bool:
            visited.add(node)
            rec_stack.add(node)
            for dep in graph.get(node, set()):
                if dep not in visited:
                    if has_cycle(dep):
                        return True
                elif dep in rec_stack:
                    return True
            rec_stack.discard(node)
            return False

        path_prefix = f"{prefix}.steps" if prefix else "steps"
        for step_id in graph:
            if step_id not in visited:
                if has_cycle(step_id):
                    result.add(path_prefix, f"Circular dependency detected involving '{step_id}'")
                    return
