export interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  items?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  enum?: unknown[];
}

export interface AgentSchema {
  type: 'string' | 'object' | 'array';
  description?: string;
  properties?: Record<string, SchemaField>;
  required?: string[];
  items?: Record<string, unknown>;
}

export interface ContextField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
}

export interface AgentDefinition {
  description: string;
  system_prompt: string;
  model?: string;
  output_retries?: number;
  history_group?: string | null;
  mcp_servers?: string[];
  can_call_agents?: string[];
  can_call_workflows?: string[];
  input_schema?: AgentSchema;
  output_schema?: AgentSchema;
  context_reads?: string[];
  context_writes?: Record<string, ContextField>;
}

export interface RetryConfig {
  max_attempts: number;
  backoff: 'fixed' | 'exponential';
  delay_seconds: number;
}

export interface FailureHandler {
  agent?: string;
  message?: string;
}

export interface StepStrategy {
  type: 'parallel' | 'for_each' | 'matrix';
  items?: string[] | string;
  matrix?: Record<string, unknown[]>;
}

export interface WorkflowStep {
  id: string;
  agent?: string;
  sub_workflow?: string;
  input?: string | Record<string, unknown>;
  if?: string;
  needs?: string[];
  strategy?: StepStrategy;
  timeout?: number;
  continue_on_error?: boolean;
  retry?: RetryConfig;
  on_failure?: FailureHandler;
  attachments?: boolean;
}

export interface SubWorkflowDefinition {
  description: string;
  input_schema?: AgentSchema;
  output_schema?: AgentSchema;
  steps: WorkflowStep[];
  output: string | Record<string, unknown>;
  variables?: Record<string, unknown>;
}

export interface WorkflowDefinition {
  name: string;
  description?: string;
  input_schema?: AgentSchema;
  output_schema?: AgentSchema;
  agents: Record<string, AgentDefinition>;
  sub_workflows?: Record<string, SubWorkflowDefinition>;
  steps: WorkflowStep[];
  variables?: Record<string, unknown>;
  output: string | Record<string, unknown>;
  fail_fast?: boolean;
  on_failure?: FailureHandler;
}

export interface WorkflowExample {
  name: string;
  description: string;
  category: 'Basics' | 'Strategies' | 'Error Handling' | 'Advanced';
  workflow: WorkflowDefinition;
}
