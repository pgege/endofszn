import { useState, useMemo } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Section, Field, ConfigSheetFooter } from './config-sheet-primitives';
import { useDraftState } from '../hooks/use-draft-state';
import { DiscardDialog } from './discard-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { YamlPreviewPanel } from './yaml-preview-panel';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Plus, X, Settings2, GitFork, AlertTriangle } from 'lucide-react';
import { HelpTooltip, HelpSection, HelpCode } from './help-tooltip';
import { ExpressionInput } from './expression-input';
import type { ExpressionSuggestion } from './expression-input';
import { SchemaAwareEditor } from './schema-aware-editor';
import { SchemaBuilder } from './schema-builder';
import { StepStrategySection } from './step-strategy-section';
import { StepRetrySection } from './step-retry-section';
import type {
  WorkflowStep, AgentDefinition, SubWorkflowDefinition, FailureHandler,
} from '@/types/workflow';

interface StepConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: WorkflowStep;
  allStepIds: string[];
  allAgentNames: string[];
  allSubWorkflowNames: string[];
  subWorkflowPath?: string;
  suggestions: ExpressionSuggestion[];
  fullYaml: string;
  agents: Record<string, AgentDefinition>;
  subWorkflows?: Record<string, SubWorkflowDefinition>;
  onUpdate: (step: WorkflowStep) => void;
  onRename: (newId: string) => void;
  onDelete: () => void;
  onUpdateAgent?: (name: string, agent: AgentDefinition) => void;
}

export function StepConfigSheet({
  open, onOpenChange, step, allStepIds, allAgentNames, allSubWorkflowNames,
  subWorkflowPath, suggestions, fullYaml, agents, subWorkflows,
  onUpdate, onRename, onDelete, onUpdateAgent,
}: StepConfigSheetProps) {
  const {
    draft, setDraft,
    editingName: editingId, setEditingName: setEditingId,
    isDirty, attempted, setAttempted,
    showDiscardDialog, setShowDiscardDialog,
    handleClose, handleDiscard,
  } = useDraftState(step, step.id, onOpenChange);
  const [newNeed, setNewNeed] = useState('');

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!editingId.trim()) errors.id = 'Step ID is required';
    if (!draft.agent && !draft.sub_workflow) errors.agent = 'Agent or sub-workflow is required';
    return errors;
  }, [editingId, draft]);

  const isValid = Object.keys(validationErrors).length === 0;
  const showError = (field: string) => attempted && validationErrors[field];

  const handleSave = () => {
    setAttempted(true);
    if (!isValid) return;
    onUpdate(draft);
    const trimmedId = editingId.trim();
    if (trimmedId && trimmedId !== step.id && !allStepIds.includes(trimmedId)) {
      onRename(trimmedId);
    }
    setAttempted(false);
    onOpenChange(false);
  };

  const update = <K extends keyof WorkflowStep>(key: K, value: WorkflowStep[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const addNeed = () => {
    const val = newNeed.trim();
    if (!val) return;
    const current = draft.needs || [];
    if (current.includes(val)) return;
    update('needs', [...current, val]);
    setNewNeed('');
  };

  const removeNeed = (dep: string) => {
    const updated = (draft.needs || []).filter((n) => n !== dep);
    update('needs', updated.length > 0 ? updated : undefined);
  };

  const handleOnFailureChange = (field: keyof FailureHandler, val: string) => {
    const current = draft.on_failure || {};
    const updated = { ...current, [field]: val || undefined };
    if (!updated.agent && !updated.message) update('on_failure', undefined);
    else update('on_failure', updated);
  };

  const otherStepIds = allStepIds.filter((id) => id !== step.id);

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="sm:max-w-3xl w-full p-0! gap-0! h-full flex flex-col overflow-hidden" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => { e.preventDefault(); if (isDirty) setShowDiscardDialog(true); }}>
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>
              {subWorkflowPath ? (
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground">{subWorkflowPath}</span>
                  <span className="text-muted-foreground">/</span>
                  <span>Step Configuration</span>
                </span>
              ) : 'Step Configuration'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-3 p-6">
                <Section icon={Settings2} title="Basic" defaultOpen>
                  <div className="space-y-4">
                    <Field label="ID" required help={
                      <HelpTooltip title="Step ID">
                        <HelpSection title="What is this?">
                          <p>A unique identifier for this step, used in expressions and dependencies.</p>
                        </HelpSection>
                      </HelpTooltip>
                    }>
                      <Input
                        value={editingId}
                        onChange={(e) => setEditingId(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        className={`h-8 text-sm font-mono ${showError('id') ? 'border-destructive ring-destructive/20 ring-2' : ''}`}
                      />
                      {showError('id') && <p className="text-[11px] text-destructive">{validationErrors.id}</p>}
                    </Field>

                    <Field label="Executor" required help={
                      <HelpTooltip title="Step Executor">
                        <HelpSection title="What is this?">
                          <p>Choose an agent or sub-workflow to execute this step.</p>
                        </HelpSection>
                      </HelpTooltip>
                    }>
                      <Select
                        value={draft.sub_workflow ? `subwf:${draft.sub_workflow}` : draft.agent || '__none__'}
                        onValueChange={(v) => {
                          if (v === '__none__') { update('agent', undefined); update('sub_workflow', undefined); }
                          else if (v.startsWith('subwf:')) { update('agent', undefined); update('sub_workflow', v.replace('subwf:', '')); }
                          else { update('agent', v); update('sub_workflow', undefined); }
                        }}
                      >
                        <SelectTrigger className={`h-8 text-sm font-mono ${showError('agent') ? 'border-destructive ring-destructive/20 ring-2' : ''}`}>
                          <SelectValue placeholder="Select executor..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__" className="text-xs">None</SelectItem>
                          {allAgentNames.map((a) => (
                            <SelectItem key={a} value={a} className="text-xs font-mono">{a}</SelectItem>
                          ))}
                          {allSubWorkflowNames.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-t mt-1 pt-2">Sub-Workflows</div>
                              {allSubWorkflowNames.map((name) => (
                                <SelectItem key={`subwf:${name}`} value={`subwf:${name}`} className="text-xs font-mono">{name}</SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {showError('agent') && <p className="text-[11px] text-destructive">{validationErrors.agent}</p>}
                    </Field>

                    <div className="space-y-3">
                      <Field label="Input" help={
                        <HelpTooltip title="Step Input">
                          <HelpSection title="What is this?">
                            <p>Data passed to the agent. Use <code className="bg-muted px-1 rounded">{'${{ }}'}</code> for dynamic values.</p>
                          </HelpSection>
                          <HelpSection title="Common patterns">
                            <HelpCode>{`$\{{ trigger.message }}
$\{{ steps.analyze.output }}`}</HelpCode>
                          </HelpSection>
                        </HelpTooltip>
                      }>
                        {(draft.agent && agents[draft.agent]?.input_schema) || (draft.sub_workflow && subWorkflows?.[draft.sub_workflow]?.input_schema) ? (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Expected Input Schema</span>
                                {draft.agent && onUpdateAgent && (
                                  <Collapsible>
                                    <CollapsibleTrigger className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Edit</CollapsibleTrigger>
                                    <CollapsibleContent className="pt-1">
                                      <SchemaBuilder
                                        value={agents[draft.agent]?.input_schema}
                                        onChange={(schema) => { if (draft.agent) onUpdateAgent(draft.agent, { ...agents[draft.agent], input_schema: schema }); }}
                                        label="Input Schema"
                                      />
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}
                              </div>
                              <pre className="border border-border bg-muted/30 p-2 text-[10px] font-mono text-muted-foreground overflow-auto max-h-[200px]">
                                {JSON.stringify(
                                  draft.agent && agents[draft.agent]?.input_schema
                                    ? agents[draft.agent].input_schema
                                    : subWorkflows?.[draft.sub_workflow!]?.input_schema,
                                  null, 2
                                )}
                              </pre>
                            </div>
                            <SchemaAwareEditor
                              value={draft.input ?? ''}
                              onChange={(val) => { if (typeof val === 'string' && !val) { update('input', undefined); return; } update('input', val); }}
                              schema={
                                draft.agent && agents[draft.agent]?.input_schema
                                  ? agents[draft.agent].input_schema
                                  : draft.sub_workflow && subWorkflows?.[draft.sub_workflow]?.input_schema
                                    ? subWorkflows[draft.sub_workflow].input_schema
                                    : undefined
                              }
                              suggestions={suggestions}
                              placeholder="${{ trigger.message }}"
                            />
                          </div>
                        ) : (
                          <SchemaAwareEditor
                            value={draft.input ?? ''}
                            onChange={(val) => { if (typeof val === 'string' && !val) { update('input', undefined); return; } update('input', val); }}
                            suggestions={suggestions}
                            placeholder="${{ trigger.message }}"
                          />
                        )}
                      </Field>

                      {draft.agent && agents[draft.agent]?.output_schema && (
                        <div className="border border-border/50 bg-muted/10 p-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Step Produces (Output Schema)</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{agents[draft.agent].output_schema!.type}</Badge>
                          </div>
                          <pre className="text-[10px] font-mono text-muted-foreground overflow-auto max-h-[120px]">
                            {JSON.stringify(agents[draft.agent].output_schema, null, 2)}
                          </pre>
                          {onUpdateAgent && (
                            <Collapsible>
                              <CollapsibleTrigger className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Edit output schema</CollapsibleTrigger>
                              <CollapsibleContent className="pt-1">
                                <SchemaBuilder
                                  value={agents[draft.agent].output_schema}
                                  onChange={(schema) => { if (draft.agent) onUpdateAgent(draft.agent, { ...agents[draft.agent], output_schema: schema }); }}
                                  label="Output Schema"
                                />
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                        </div>
                      )}
                    </div>

                    <Field label="Condition (if)" help={
                      <HelpTooltip title="Step Condition">
                        <HelpSection title="What is this?">
                          <p>Boolean expression controlling whether this step runs.</p>
                        </HelpSection>
                        <HelpSection title="Examples">
                          <HelpCode>{`$\{{ steps.route.output == 'product' }}`}</HelpCode>
                        </HelpSection>
                      </HelpTooltip>
                    }>
                      <ExpressionInput
                        value={draft.if || ''}
                        onChange={(v) => update('if', v || undefined)}
                        suggestions={suggestions}
                        multiline
                        placeholder="${{ steps.route.output == 'product' }}"
                      />
                    </Field>
                  </div>
                </Section>

                <Section icon={GitFork} title="Dependencies & Execution" defaultOpen={!!(draft.needs?.length || draft.timeout || draft.continue_on_error)}>
                  <div className="space-y-4">
                    <Field label="Dependencies (needs)" help={
                      <HelpTooltip title="Step Dependencies">
                        <HelpSection title="What is this?">
                          <p>Steps that must complete before this one runs.</p>
                        </HelpSection>
                      </HelpTooltip>
                    }>
                      {draft.needs && draft.needs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {draft.needs.map((dep) => (
                            <Badge key={dep} variant="secondary" className="font-mono text-xs gap-1 pr-1">
                              {dep}
                              <button type="button" onClick={() => removeNeed(dep)} className="ml-0.5 hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Select value={newNeed} onValueChange={setNewNeed}>
                          <SelectTrigger className="h-8 text-xs font-mono flex-1"><SelectValue placeholder="Select dependency..." /></SelectTrigger>
                          <SelectContent>
                            {otherStepIds.filter((id) => !(draft.needs || []).includes(id)).map((id) => (
                              <SelectItem key={id} value={id} className="text-xs font-mono">{id}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={addNeed} disabled={!newNeed}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </Field>

                    <Field label="Timeout (seconds)" help={
                      <HelpTooltip title="Step Timeout">
                        <HelpSection title="What is this?">
                          <p>Maximum execution time in seconds.</p>
                        </HelpSection>
                      </HelpTooltip>
                    }>
                      <div className="flex items-center gap-2">
                        <Input type="number" value={draft.timeout ?? ''} onChange={(e) => update('timeout', e.target.value ? Number(e.target.value) : undefined)} placeholder="120" className="h-8 text-xs font-mono flex-1" />
                        <div className="flex gap-1">
                          {[30, 60, 120, 300].map((t) => (
                            <Button
                              key={t}
                              variant={draft.timeout === t ? 'default' : 'outline'}
                              size="sm" className="h-7 text-[10px] px-2 font-mono"
                              onClick={() => update('timeout', draft.timeout === t ? undefined : t)}
                            >
                              {t}s
                            </Button>
                          ))}
                        </div>
                      </div>
                    </Field>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-medium">Continue on Error</Label>
                          <p className="text-[11px] text-muted-foreground">Allow subsequent steps to run even if this step fails.</p>
                        </div>
                      </div>
                      <Switch checked={draft.continue_on_error || false} onCheckedChange={(checked) => update('continue_on_error', checked || undefined)} />
                    </div>
                  </div>
                </Section>

                <StepRetrySection draft={draft} update={update} />
                <StepStrategySection draft={draft} update={update} suggestions={suggestions} />

                <Section icon={AlertTriangle} title="On Failure" defaultOpen={!!draft.on_failure}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 -mt-1">
                      <HelpTooltip title="Failure Handler">
                        <HelpSection title="What is this?">
                          <p>What happens when this step fails. Delegate to a fallback agent or return a message.</p>
                        </HelpSection>
                      </HelpTooltip>
                    </div>
                    <Field label="Agent">
                      <Select value={draft.on_failure?.agent || '__none__'} onValueChange={(v) => handleOnFailureChange('agent', v === '__none__' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs font-mono"><SelectValue placeholder="None" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__" className="text-xs">None</SelectItem>
                          {allAgentNames.map((a) => (<SelectItem key={a} value={a} className="text-xs font-mono">{a}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Message">
                      <Textarea value={draft.on_failure?.message || ''} onChange={(e) => handleOnFailureChange('message', e.target.value)} placeholder="Fallback message..." className="text-xs min-h-[60px]" />
                    </Field>
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
