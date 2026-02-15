import { useState, useMemo, useCallback } from 'react';
import { stringify as yamlStringify, parse as yamlParse } from 'yaml';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { YamlPreviewPanel } from './yaml-preview-panel';
import { Section, Field } from './config-sheet-primitives';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Bot,
  GitBranch,
  ChevronRight,
  FileText,
  FileJson,
  Database,
  AlertTriangle,
  LayoutList,
} from 'lucide-react';
import { SchemaBuilder } from './schema-builder';
import { HelpTooltip, HelpSection } from './help-tooltip';
import { SchemaAwareEditor } from './schema-aware-editor';
import type { ExpressionSuggestion } from './expression-input';
import type {
  WorkflowDefinition,
  AgentDefinition,
  AgentSchema,
  WorkflowStep,
  FailureHandler,
} from '@/types/workflow';

interface WorkflowConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: WorkflowDefinition;
  suggestions: ExpressionSuggestion[];
  onUpdateField: <K extends keyof WorkflowDefinition>(
    key: K,
    value: WorkflowDefinition[K]
  ) => void;
  onSetWorkflow: (workflow: WorkflowDefinition) => void;
  onAddAgent: (name: string, agent: AgentDefinition) => void;
  onRemoveAgent: (name: string) => void;
  onAddStep: (step: WorkflowStep) => void;
  onRemoveStep: (id: string) => void;
  onSelectAgent: (name: string) => void;
  onSelectStep: (id: string) => void;
}

export function WorkflowConfigSheet({
  open,
  onOpenChange,
  workflow,
  suggestions,
  onUpdateField,
  onSetWorkflow,
  onAddAgent,
  onRemoveAgent,
  onAddStep,
  onRemoveStep,
  onSelectAgent,
  onSelectStep,
}: WorkflowConfigSheetProps) {
  const [newAgentName, setNewAgentName] = useState('');
  const [newStepId, setNewStepId] = useState('');
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarValue, setNewVarValue] = useState('');


  const agentNames = Object.keys(workflow.agents);
  const stepIds = workflow.steps.map((s) => s.id);

  const yamlValue = useMemo(
    () => yamlStringify(workflow, { lineWidth: 120 }),
    [workflow]
  );

  const handleYamlChange = useCallback(
    (val: string) => {
      try {
        const parsed = yamlParse(val) as WorkflowDefinition;
        if (parsed && parsed.name && parsed.agents && parsed.steps && parsed.output) {
          onSetWorkflow(parsed);
        }
      } catch {}
    },
    [onSetWorkflow]
  );

  const handleAddAgent = () => {
    const name = newAgentName.trim();
    if (!name || workflow.agents[name]) return;
    onAddAgent(name, { description: '', system_prompt: '' });
    setNewAgentName('');
  };

  const handleAddStep = () => {
    const id = newStepId.trim();
    if (!id || workflow.steps.some((s) => s.id === id)) return;
    onAddStep({ id });
    setNewStepId('');
  };

  const handleAddVariable = () => {
    const key = newVarKey.trim();
    if (!key) return;
    let parsed: unknown = newVarValue;
    try { parsed = JSON.parse(newVarValue); } catch {}
    onUpdateField('variables', { ...(workflow.variables || {}), [key]: parsed });
    setNewVarKey('');
    setNewVarValue('');
  };

  const handleRemoveVariable = (key: string) => {
    const vars = { ...(workflow.variables || {}) };
    delete vars[key];
    onUpdateField('variables', Object.keys(vars).length > 0 ? vars : undefined);
  };

  const handleUpdateVariable = (key: string, rawValue: string) => {
    let parsed: unknown = rawValue;
    try { parsed = JSON.parse(rawValue); } catch {}
    onUpdateField('variables', { ...(workflow.variables || {}), [key]: parsed });
  };

  const handleOutputChange = (val: string | Record<string, unknown>) => {
    onUpdateField('output', val || '');
  };

  const outputWarning = useMemo(() => {
    if (!workflow.output_schema) return null;
    const output = workflow.output;
    if (!output || (typeof output === 'string' && !output.trim())) {
      return 'Output expression is required when an output schema is defined.';
    }
    if (workflow.output_schema.type === 'object' && workflow.output_schema.properties) {
      if (typeof output !== 'object') {
        return 'Output must be an object to match the output schema.';
      }
      if (workflow.output_schema.required) {
        const missing = workflow.output_schema.required.filter(
          (key) => !(output as Record<string, unknown>)[key]
        );
        if (missing.length > 0) {
          return `Missing required output fields: ${missing.join(', ')}`;
        }
      }
    }
    return null;
  }, [workflow.output, workflow.output_schema]);

  const handleOnFailureChange = (field: keyof FailureHandler, val: string) => {
    if (!val && !workflow.on_failure) return;
    const current = workflow.on_failure || {};
    const updated = { ...current, [field]: val || undefined };
    if (!updated.agent && !updated.message) {
      onUpdateField('on_failure', undefined);
    } else {
      onUpdateField('on_failure', updated);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl w-full h-full p-0 flex flex-col gap-0" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <SheetTitle>Workflow Configuration</SheetTitle>
        </SheetHeader>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-3 p-6">
              <Section icon={FileText} title="Basic" defaultOpen>
                <div className="space-y-4">
                  <Field label="Name">
                    <Input
                      value={workflow.name}
                      onChange={(e) => onUpdateField('name', e.target.value)}
                      className="h-8 text-sm font-mono"
                    />
                  </Field>

                  <Field label="Description">
                    <Textarea
                      value={workflow.description || ''}
                      onChange={(e) => onUpdateField('description', e.target.value || undefined)}
                      placeholder="Describe what this workflow does..."
                      className="text-sm min-h-[60px]"
                    />
                  </Field>
                </div>
              </Section>

              <Section icon={FileJson} title="Input Schema" defaultOpen={!!workflow.input_schema}>
                <div className="space-y-2">
                  <div className="flex items-center gap-1 -mt-1 mb-1">
                    <HelpTooltip title="Workflow Input Schema">
                      <HelpSection title="What is this?">
                        <p>Defines the expected input shape for this workflow (trigger format). For chat workflows this is typically <code className="bg-muted px-1 rounded">type: string</code>. For API-callable workflows, use <code className="bg-muted px-1 rounded">type: object</code> with structured properties.</p>
                      </HelpSection>
                    </HelpTooltip>
                  </div>
                  <SchemaBuilder
                    label="Input Schema"
                    value={workflow.input_schema}
                    onChange={(schema: AgentSchema | undefined) => onUpdateField('input_schema', schema)}
                  />
                </div>
              </Section>

              <Section icon={Database} title="Data & Output" defaultOpen>
                <div className="space-y-4">
                  <Field label="Variables">
                    {workflow.variables && Object.keys(workflow.variables).length > 0 && (
                      <div className="space-y-2 mb-3">
                        {Object.entries(workflow.variables).map(([key, val]) => (
                          <div key={key} className="flex items-center gap-2">
                            <Input value={key} disabled className="h-8 text-xs font-mono w-1/3" />
                            <Input
                              value={typeof val === 'string' ? val : JSON.stringify(val)}
                              onChange={(e) => handleUpdateVariable(key, e.target.value)}
                              className="h-8 text-xs font-mono flex-1"
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleRemoveVariable(key)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input value={newVarKey} onChange={(e) => setNewVarKey(e.target.value)} placeholder="key" className="h-8 text-xs font-mono w-1/3" />
                      <Input value={newVarValue} onChange={(e) => setNewVarValue(e.target.value)} placeholder="value" className="h-8 text-xs font-mono flex-1" />
                      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handleAddVariable} disabled={!newVarKey.trim()}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">Key-value pairs accessible via $&#123;&#123; variables.key &#125;&#125;</p>
                  </Field>

                  <Field label="Output" help={
                    <HelpTooltip title="Workflow Output">
                      <HelpSection title="What is this?">
                        <p>The final value this workflow returns. The output schema (left) defines the expected shape; the output expression (right) maps step results to that shape.</p>
                      </HelpSection>
                      <HelpSection title="How it works">
                        <p>Use <code className="bg-muted px-1 rounded">{'${{ steps.stepId.output }}'}</code> expressions to reference step outputs. In JSON mode, type <code className="bg-muted px-1 rounded">{'${{ '}</code> for autocomplete.</p>
                      </HelpSection>
                    </HelpTooltip>
                  }>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Output Schema</span>
                        <SchemaBuilder
                          label="Output Schema"
                          value={workflow.output_schema}
                          onChange={(schema: AgentSchema | undefined) => {
                            onUpdateField('output_schema', schema);
                            if (schema?.type === 'object' && schema.properties && typeof workflow.output === 'string') {
                              onUpdateField('output', {});
                            }
                            if (schema?.type === 'string' && typeof workflow.output === 'object') {
                              onUpdateField('output', '');
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Output Expression</span>
                        <SchemaAwareEditor
                          value={workflow.output}
                          onChange={handleOutputChange}
                          schema={workflow.output_schema}
                          suggestions={suggestions}
                        />
                        {outputWarning && (
                          <p className="text-[11px] text-destructive">{outputWarning}</p>
                        )}
                      </div>
                    </div>
                  </Field>
                </div>
              </Section>

              <Section icon={AlertTriangle} title="Control Flow" defaultOpen={!!(workflow.fail_fast || workflow.on_failure)}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium">Fail Fast</Label>
                      <p className="text-[11px] text-muted-foreground">Stop all steps immediately when any step fails.</p>
                    </div>
                    <Switch
                      checked={workflow.fail_fast || false}
                      onCheckedChange={(checked) => onUpdateField('fail_fast', checked || undefined)}
                    />
                  </div>

                  <Field label="On Failure - Agent">
                    <Select value={workflow.on_failure?.agent || '__none__'} onValueChange={(v) => handleOnFailureChange('agent', v === '__none__' ? '' : v)}>
                      <SelectTrigger className="h-8 text-xs font-mono"><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" className="text-xs">None</SelectItem>
                        {agentNames.map((a) => (<SelectItem key={a} value={a} className="text-xs font-mono">{a}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1">Agent to invoke when the workflow fails.</p>
                  </Field>

                  <Field label="On Failure - Message">
                    <Textarea
                      value={workflow.on_failure?.message || ''}
                      onChange={(e) => handleOnFailureChange('message', e.target.value)}
                      placeholder="Fallback message on failure"
                      className="text-xs min-h-[60px]"
                    />
                  </Field>
                </div>
              </Section>

              <Section icon={Bot} title={`Agents (${agentNames.length})`} defaultOpen>
                <div className="space-y-3">
                  <div className="space-y-1">
                    {agentNames.map((name) => (
                      <div key={name} className="flex items-center justify-between group hover:bg-muted/50 px-2 py-1.5 -mx-2">
                        <button
                          type="button"
                          className="flex items-center gap-2 text-sm flex-1 min-w-0 text-left"
                          onClick={() => { onOpenChange(false); onSelectAgent(name); }}
                        >
                          <Bot className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono truncate">{name}</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
                        </button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => onRemoveAgent(name)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newAgentName}
                      onChange={(e) => setNewAgentName(e.target.value)}
                      placeholder="new-agent-name"
                      className="h-8 text-xs font-mono flex-1"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAgent(); } }}
                    />
                    <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={handleAddAgent} disabled={!newAgentName.trim() || !!workflow.agents[newAgentName.trim()]}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </Section>

              <Section icon={LayoutList} title={`Steps (${stepIds.length})`} defaultOpen>
                <div className="space-y-3">
                  <div className="space-y-1">
                    {workflow.steps.map((step) => (
                      <div key={step.id} className="flex items-center justify-between group hover:bg-muted/50 px-2 py-1.5 -mx-2">
                        <button
                          type="button"
                          className="flex items-center gap-2 text-sm flex-1 min-w-0 text-left"
                          onClick={() => { onOpenChange(false); onSelectStep(step.id); }}
                        >
                          <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono truncate">{step.id}</span>
                          <span className="text-xs text-muted-foreground ml-1 truncate">{step.agent || 'sub_workflow'}</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
                        </button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => onRemoveStep(step.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newStepId}
                      onChange={(e) => setNewStepId(e.target.value)}
                      placeholder="new-step-id"
                      className="h-8 text-xs font-mono flex-1"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStep(); } }}
                    />
                    <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={handleAddStep} disabled={!newStepId.trim() || workflow.steps.some((s) => s.id === newStepId.trim())}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </Section>
            </div>
          </ScrollArea>
          <YamlPreviewPanel value={yamlValue} onChange={handleYamlChange} label="YAML" hint="Edits sync to the form" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

