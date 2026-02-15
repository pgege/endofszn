from pydantic import BaseModel, Field
from typing import Any, Literal
from enum import Enum


class ContextField(BaseModel):
    type: Literal["string", "number", "boolean", "array", "object"]
    description: str | None = None
    items: dict[str, Any] | None = None
    properties: dict[str, Any] | None = None


class SchemaField(BaseModel):
    type: Literal["string", "number", "boolean", "array", "object"]
    description: str | None = None
    items: dict[str, Any] | None = None
    properties: dict[str, Any] | None = None
    enum: list[Any] | None = None


class AgentSchema(BaseModel):
    type: Literal["string", "object", "array"] = "string"
    description: str | None = None
    properties: dict[str, SchemaField] = Field(default_factory=dict)
    required: list[str] = Field(default_factory=list)
    items: dict[str, Any] | None = None


class AgentDefinition(BaseModel):
    description: str
    system_prompt: str
    model: str | None = None
    output_retries: int = 3
    history_group: str | None = "default"
    mcp_servers: list[str] = Field(default_factory=list)
    can_call_agents: list[str] = Field(default_factory=list)
    can_call_workflows: list[str] = Field(default_factory=list)
    input_schema: AgentSchema = Field(default_factory=lambda: AgentSchema(type="string", description="Input message"))
    output_schema: AgentSchema = Field(default_factory=lambda: AgentSchema(type="string", description="Response"))
    context_reads: list[str] = Field(default_factory=list)
    context_writes: dict[str, ContextField] = Field(default_factory=dict)


class StepStrategy(BaseModel):
    type: Literal["parallel", "sequential", "for_each", "matrix"] = "sequential"
    items: list[str] | str = Field(default_factory=list)
    matrix: dict[str, list[Any]] = Field(default_factory=dict)


class FailureHandler(BaseModel):
    agent: str | None = None
    message: str | None = None


class RetryConfig(BaseModel):
    max_attempts: int = 1
    backoff: Literal["fixed", "exponential"] = "fixed"
    delay_seconds: float = 1.0


class WorkflowStep(BaseModel):
    id: str
    agent: str = ""
    sub_workflow: str = ""
    input: str | dict[str, Any] = Field(default="${{ trigger.message }}")
    condition: str | None = Field(default=None, alias="if")
    depends_on: list[str] = Field(default_factory=list, alias="needs")
    strategy: StepStrategy | None = None
    timeout: int | None = None
    continue_on_error: bool = False
    retry: RetryConfig | None = None
    on_failure: FailureHandler | None = None
    attachments: bool = False

    class Config:
        populate_by_name = True


class WorkflowTrigger(BaseModel):
    type: str
    conditions: dict[str, Any] = Field(default_factory=dict)


class SubWorkflowDefinition(BaseModel):
    description: str = ""
    input_schema: AgentSchema | None = None
    output_schema: AgentSchema | None = None
    steps: list[WorkflowStep] = Field(default_factory=list)
    output: str | dict[str, Any] = ""
    variables: dict[str, Any] = Field(default_factory=dict)


class WorkflowDefinition(BaseModel):
    name: str
    description: str | None = None
    input_schema: AgentSchema | None = None
    output_schema: AgentSchema | None = None
    triggers: list[str] = Field(default_factory=lambda: ["user_message"])
    agents: dict[str, AgentDefinition] = Field(default_factory=dict)
    sub_workflows: dict[str, SubWorkflowDefinition] = Field(default_factory=dict)
    steps: list[WorkflowStep] = Field(default_factory=list)
    variables: dict[str, Any] = Field(default_factory=dict)
    output: str | dict[str, Any]
    fail_fast: bool = False
    on_failure: FailureHandler | None = None


class AgentTemplate(BaseModel):
    description: str
    system_prompt: str
    model: str | None = None
    history_group: str | None = "default"
    mcp_servers: list[str] = Field(default_factory=list)
    can_call_agents: list[str] = Field(default_factory=list)
    input_schema: AgentSchema = Field(default_factory=lambda: AgentSchema(type="string", description="Input message"))
    output_schema: AgentSchema = Field(default_factory=lambda: AgentSchema(type="string", description="Response"))
    context_reads: list[str] = Field(default_factory=list)
    context_writes: dict[str, ContextField] = Field(default_factory=dict)


class StepTemplate(BaseModel):
    agent: str
    input: str | dict[str, Any] = Field(default="${{ trigger.message }}")
    condition: str | None = Field(default=None, alias="if")
    strategy: StepStrategy | None = None
    timeout: int | None = None
    continue_on_error: bool = False
    retry: RetryConfig | None = None
    on_failure: FailureHandler | None = None

    class Config:
        populate_by_name = True


class WorkflowTemplates(BaseModel):
    agents: dict[str, AgentTemplate] = Field(default_factory=dict)
    steps: dict[str, StepTemplate] = Field(default_factory=dict)


class WorkflowRegistry(BaseModel):
    workflows: dict[str, WorkflowDefinition] = Field(default_factory=dict)
    templates: WorkflowTemplates = Field(default_factory=WorkflowTemplates)


class StepResult(BaseModel):
    step_id: str
    status: Literal["success", "failure", "skipped"]
    output: str | dict[str, Any] | list[Any] = ""
    error: str | None = None
    messages: list[dict[str, Any]] = Field(default_factory=list)


class SharedContext(BaseModel):
    data: dict[str, Any] = Field(default_factory=dict)
    field_schemas: dict[str, ContextField] = Field(default_factory=dict)

    def get(self, key: str) -> Any:
        return self.data.get(key)

    def set(self, key: str, value: Any, field_def: ContextField | None = None) -> None:
        self.data[key] = value
        if field_def:
            self.field_schemas[key] = field_def

    def has(self, key: str) -> bool:
        return key in self.data

    def keys(self) -> list[str]:
        return list(self.data.keys())


class StepTrace(BaseModel):
    step_id: str
    agent: str = ""
    status: str = ""
    started_at: str = ""
    finished_at: str = ""
    duration_ms: int = 0
    attempt: int = 1
    error: str | None = None


class WorkflowTrace(BaseModel):
    workflow_name: str = ""
    workflow_run_id: str = ""
    started_at: str = ""
    finished_at: str = ""
    duration_ms: int = 0
    step_traces: list[StepTrace] = Field(default_factory=list)
    status: str = "running"


class WorkflowContext(BaseModel):
    workflow_id: str
    workflow_run_id: str
    trigger: dict[str, Any] = Field(default_factory=dict)
    steps: dict[str, StepResult] = Field(default_factory=dict)
    variables: dict[str, Any] = Field(default_factory=dict)
    shared: SharedContext = Field(default_factory=SharedContext)
    trace: WorkflowTrace = Field(default_factory=WorkflowTrace)