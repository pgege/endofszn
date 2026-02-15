import { useState, useMemo } from 'react';
import { stringify as yamlStringify } from 'yaml';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useDraftState } from '../hooks/use-draft-state';
import { DiscardDialog } from './discard-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { YamlPreviewPanel } from './yaml-preview-panel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  X,
  Workflow,
  FileJson,
  Layers,
} from 'lucide-react';
import { Section, Field, ConfigSheetFooter } from './config-sheet-primitives';
import { SchemaBuilder } from './schema-builder';
import { HelpTooltip, HelpSection } from './help-tooltip';
import { SchemaAwareEditor } from './schema-aware-editor';
import type { ExpressionSuggestion } from './expression-input';
import type { SubWorkflowDefinition, WorkflowStep, AgentSchema } from '@/types/workflow';

interface SubWorkflowConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  subWorkflow: SubWorkflowDefinition;
  allAgentNames: string[];
  suggestions?: ExpressionSuggestion[];
  onUpdate: (subWf: SubWorkflowDefinition) => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
}

export function SubWorkflowConfigSheet({
  open,
  onOpenChange,
  name,
  subWorkflow,
  allAgentNames,
  suggestions,
  onUpdate,
  onRename,
  onDelete,
}: SubWorkflowConfigSheetProps) {
  const {
    draft, setDraft, editingName, setEditingName,
    isDirty, attempted, setAttempted,
    showDiscardDialog, setShowDiscardDialog,
    handleClose, handleDiscard,
  } = useDraftState(subWorkflow, name, onOpenChange);
  const [newStepId, setNewStepId] = useState('');
  const [newStepAgent, setNewStepAgent] = useState('');

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!editingName.trim()) errors.name = 'Name is required';
    if (draft.steps.length === 0) errors.steps = 'At least one step is required';
    if (!draft.output || (typeof draft.output === 'string' && !draft.output.trim())) {
      errors.output = 'Output expression is required';
    }
    if (draft.output_schema?.type === 'object' && draft.output_schema.properties) {
      if (typeof draft.output !== 'object') {
        errors.output = 'Output must be an object to match the output schema';
      } else if (draft.output_schema.required) {
        const missing = draft.output_schema.required.filter(
          (key) => !(draft.output as Record<string, unknown>)[key]
        );
        if (missing.length > 0) {
          errors.output = `Missing required output fields: ${missing.join(', ')}`;
        }
      }
    }
    return errors;
  }, [editingName, draft]);

  const isValid = Object.keys(validationErrors).length === 0;
  const showError = (field: string) => attempted && validationErrors[field];

  const handleSave = () => {
    setAttempted(true);
    if (!isValid) return;
    onUpdate(draft);
    const trimmedName = editingName.trim();
    if (trimmedName && trimmedName !== name) {
      onRename(trimmedName);
    }
    setAttempted(false);
    onOpenChange(false);
  };

  const addStep = () => {
    const id = newStepId.trim();
    if (!id) return;
    if (draft.steps.some((s) => s.id === id)) return;
    const step: WorkflowStep = { id, agent: newStepAgent || undefined };
    setDraft((prev) => ({ ...prev, steps: [...prev.steps, step] }));
    setNewStepId('');
    setNewStepAgent('');
  };

  const removeStep = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== id),
    }));
  };

  const fullYaml = useMemo(() => {
    try {
      return yamlStringify({ [editingName || name]: draft }, { lineWidth: 120 });
    } catch {
      return '';
    }
  }, [draft, editingName, name]);

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          className="sm:max-w-3xl w-full p-0! gap-0! h-full flex flex-col overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => { e.preventDefault(); if (isDirty) setShowDiscardDialog(true); }}
        >
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Workflow className="h-4 w-4 text-primary" />
              Sub-Workflow Configuration
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-3 p-6">
                <Section icon={Workflow} title="Basic" defaultOpen>
                  <div className="space-y-4">
                    <Field label="Name" required>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className={`h-8 text-sm font-mono ${showError('name') ? 'border-destructive ring-destructive/20 ring-2' : ''}`}
                        placeholder="order-handler"
                      />
                      {showError('name') && <p className="text-[11px] text-destructive">{validationErrors.name}</p>}
                    </Field>

                    <Field label="Description" help={
                      <HelpTooltip title="Description">
                        <HelpSection title="What is this?">
                          <p>A brief description of what this sub-workflow does. Used as the tool description when agents call this sub-workflow.</p>
                        </HelpSection>
                      </HelpTooltip>
                    }>
                      <Textarea
                        value={draft.description}
                        onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Handle order-related customer requests..."
                        className="text-xs min-h-[60px]"
                      />
                    </Field>

                    <Field label="Output" help={
                      <HelpTooltip title="Output">
                        <HelpSection title="What is this?">
                          <p>The output schema (left) defines the expected return shape. The output expression (right) maps step results to that shape.</p>
                        </HelpSection>
                        <HelpSection title="How it works">
                          <p>Use <code className="bg-muted px-1 rounded">{'${{ steps.stepId.output }}'}</code> to reference step outputs. In JSON mode, type <code className="bg-muted px-1 rounded">{'${{ '}</code> for autocomplete.</p>
                        </HelpSection>
                      </HelpTooltip>
                    }>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Output Schema</span>
                          <SchemaBuilder
                            label="Output Schema"
                            value={draft.output_schema}
                            onChange={(schema: AgentSchema | undefined) => {
                              setDraft((prev) => {
                                const updated = { ...prev, output_schema: schema };
                                if (schema?.type === 'object' && schema.properties && typeof prev.output === 'string') {
                                  updated.output = {};
                                }
                                if (schema?.type === 'string' && typeof prev.output === 'object') {
                                  updated.output = '';
                                }
                                return updated;
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Output Expression</span>
                          <SchemaAwareEditor
                            value={draft.output}
                            onChange={(val) => setDraft((prev) => ({ ...prev, output: val }))}
                            schema={draft.output_schema}
                            suggestions={suggestions}
                          />
                          {showError('output') && <p className="text-[11px] text-destructive">{validationErrors.output}</p>}
                        </div>
                      </div>
                    </Field>
                  </div>
                </Section>

                <Section icon={FileJson} title="Input Schema" defaultOpen={!!draft.input_schema}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 -mt-1 mb-1">
                      <HelpTooltip title="Input Schema">
                        <HelpSection title="What is this?">
                          <p>Defines the expected input shape for this sub-workflow. Parent steps must pass data matching this schema.</p>
                        </HelpSection>
                        <HelpSection title="Usage">
                          <p>Inside the sub-workflow, access input via <code className="bg-muted px-1 rounded">{'${{ trigger.field_name }}'}</code>.</p>
                        </HelpSection>
                      </HelpTooltip>
                    </div>
                    <SchemaBuilder
                      label="Input Schema"
                      value={draft.input_schema}
                      onChange={(schema: AgentSchema | undefined) =>
                        setDraft((prev) => ({ ...prev, input_schema: schema }))
                      }
                    />
                  </div>
                </Section>

                <Section icon={Layers} title="Steps" defaultOpen>
                  <div className="space-y-3">
                    {showError('steps') && (
                      <p className="text-[11px] text-destructive">{validationErrors.steps}</p>
                    )}
                    {draft.steps.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-2 border bg-muted/30 px-3 py-2">
                        <span className="text-[10px] text-muted-foreground w-5">{i + 1}</span>
                        <span className="text-xs font-mono font-medium flex-1 truncate">{s.id}</span>
                        {s.agent && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{s.agent}</Badge>
                        )}
                        {s.sub_workflow && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            <Workflow className="h-2.5 w-2.5 mr-0.5" />
                            {s.sub_workflow}
                          </Badge>
                        )}
                        {s.needs && s.needs.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">needs: {s.needs.join(', ')}</span>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeStep(s.id)}>
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <Input
                        value={newStepId}
                        onChange={(e) => setNewStepId(e.target.value)}
                        placeholder="step-id"
                        className="h-8 text-xs font-mono flex-1"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStep(); } }}
                      />
                      <Select value={newStepAgent} onValueChange={setNewStepAgent}>
                        <SelectTrigger className="h-8 text-xs font-mono w-[140px]">
                          <SelectValue placeholder="Agent..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allAgentNames.map((a) => (
                            <SelectItem key={a} value={a} className="text-xs font-mono">{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={addStep} disabled={!newStepId.trim()}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Section>
              </div>
            </ScrollArea>
            <YamlPreviewPanel value={fullYaml} />
          </div>

          <ConfigSheetFooter onDelete={onDelete} onCancel={() => handleClose(false)} onSave={handleSave} saveDisabled={attempted && !isValid} />
        </SheetContent>
      </Sheet>

      <DiscardDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog} onDiscard={handleDiscard} />
    </>
  );
}
