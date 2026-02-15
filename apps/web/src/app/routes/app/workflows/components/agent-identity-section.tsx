import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { User } from 'lucide-react';
import { Section, Field } from './config-sheet-primitives';
import { HelpTooltip, HelpSection, HelpCode } from './help-tooltip';
import { ExpressionInput } from './expression-input';
import type { ExpressionSuggestion } from './expression-input';
import type { AgentDefinition } from '@/types/workflow';

const KNOWN_MODELS = [
  { value: '__default__', label: 'Default' },
  { value: 'anthropic/claude-opus-4.6', label: 'Claude Opus 4.6' },
  { value: 'anthropic/claude-opus-4.5', label: 'Claude Opus 4.5' },
  { value: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
  { value: 'anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5' },
] as const;

const HISTORY_PRESETS = [
  { value: 'default', label: 'Shared (default)', desc: 'Shares history with other agents in the same group' },
  { value: '__isolated__', label: 'Isolated', desc: 'This agent keeps its own separate history' },
  { value: '__stateless__', label: 'Stateless', desc: 'No history — every invocation starts fresh' },
] as const;

interface AgentIdentitySectionProps {
  draft: AgentDefinition;
  update: <K extends keyof AgentDefinition>(key: K, value: AgentDefinition[K]) => void;
  editingName: string;
  setEditingName: (name: string) => void;
  name: string;
  suggestions: ExpressionSuggestion[];
  showError: (field: string) => string | undefined;
  validationErrors: Record<string, string>;
}

export function AgentIdentitySection({
  draft, update, editingName, setEditingName, name,
  suggestions, showError, validationErrors,
}: AgentIdentitySectionProps) {
  const [customModel, setCustomModel] = useState('');

  const historySelectValue = draft.history_group === null || draft.history_group === undefined
    ? '__stateless__'
    : draft.history_group === 'default' || draft.history_group === ''
      ? 'default'
      : draft.history_group;

  const isCustomHistoryGroup =
    draft.history_group !== null &&
    draft.history_group !== undefined &&
    draft.history_group !== 'default' &&
    draft.history_group !== '';

  const isKnown = !draft.model || KNOWN_MODELS.some((m) => m.value === draft.model);
  const selectValue = !draft.model ? '__default__' : isKnown ? draft.model : '__custom__';
  const showCustomInput = selectValue === '__custom__';

  return (
    <Section icon={User} title="Identity" defaultOpen>
      <div className="space-y-4">
        <Field label="Name" help={
          <HelpTooltip title="Agent Name">
            <HelpSection title="What is this?">
              <p>A unique identifier for this agent within the workflow.</p>
            </HelpSection>
            <HelpSection title="Examples">
              <HelpCode>{`assistant\nproduct-expert\norder-router`}</HelpCode>
            </HelpSection>
          </HelpTooltip>
        }>
          <Input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            className="h-8 text-sm font-mono"
          />
        </Field>

        <Field label="Description" required help={
          <HelpTooltip title="Agent Description">
            <HelpSection title="What is this?">
              <p>A brief human-readable description of what this agent does.</p>
            </HelpSection>
          </HelpTooltip>
        }>
          <Textarea
            value={draft.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="What does this agent do?"
            className={`text-sm min-h-[60px] ${showError('description') ? 'border-destructive ring-destructive/20 ring-2' : ''}`}
          />
          {showError('description') && <p className="text-[11px] text-destructive">{validationErrors.description}</p>}
        </Field>

        <Field label="System Prompt" required help={
          <HelpTooltip title="System Prompt">
            <HelpSection title="What is this?">
              <p>Instructions that define the agent's behavior. Use <code className="bg-muted px-1 rounded">{'${{ }}'}</code> expressions for dynamic data.</p>
            </HelpSection>
            <HelpSection title="Available expressions">
              <HelpCode>{`$\{{ trigger.message }}     — User's input
$\{{ variables.key }}       — Workflow variables
$\{{ context.key }}         — Shared context
$\{{ steps.id.output }}     — Step output`}</HelpCode>
            </HelpSection>
          </HelpTooltip>
        }>
          <ExpressionInput
            value={draft.system_prompt}
            onChange={(v) => update('system_prompt', v)}
            suggestions={suggestions}
            multiline
            placeholder="Instructions for the agent..."
            className={`min-h-[120px] ${showError('system_prompt') ? 'border-destructive ring-destructive/20 ring-2' : ''}`}
          />
          {showError('system_prompt') && <p className="text-[11px] text-destructive">{validationErrors.system_prompt}</p>}
        </Field>

        <Field label="Model" help={
          <HelpTooltip title="LLM Model">
            <HelpSection title="What is this?">
              <p>The language model this agent uses. Leave as "Default" to use the workflow's default model.</p>
            </HelpSection>
          </HelpTooltip>
        }>
          <Select
            value={selectValue}
            onValueChange={(v) => {
              if (v === '__custom__') setCustomModel(draft.model || '');
              else if (v === '__default__') { update('model', undefined); setCustomModel(''); }
              else { update('model', v); setCustomModel(''); }
            }}
          >
            <SelectTrigger className="h-8 text-sm font-mono"><SelectValue placeholder="Default" /></SelectTrigger>
            <SelectContent>
              {KNOWN_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-xs">
                  <span className="font-mono">{m.label}</span>
                </SelectItem>
              ))}
              <SelectItem value="__custom__" className="text-xs">Other...</SelectItem>
            </SelectContent>
          </Select>
          {showCustomInput && (
            <Input
              value={draft.model || customModel}
              onChange={(e) => { setCustomModel(e.target.value); update('model', e.target.value || undefined); }}
              placeholder="custom-model-name"
              className="h-8 text-xs font-mono mt-1.5"
              autoFocus
            />
          )}
        </Field>

        <Field label="History Group" help={
          <HelpTooltip title="History Group">
            <HelpSection title="Modes">
              <p><strong>Shared</strong> — Same group name = shared history.</p>
              <p><strong>Isolated</strong> — Own history.</p>
              <p><strong>Stateless</strong> — No history.</p>
            </HelpSection>
          </HelpTooltip>
        }>
          <Select
            value={isCustomHistoryGroup ? '__custom__' : historySelectValue}
            onValueChange={(v) => {
              if (v === 'default') update('history_group', 'default');
              else if (v === '__isolated__') update('history_group', name);
              else if (v === '__stateless__') update('history_group', null);
              else if (v === '__custom__') update('history_group', name);
            }}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {HISTORY_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value} className="text-xs">
                  <div className="flex flex-col">
                    <span>{p.label}</span>
                    <span className="text-[10px] text-muted-foreground">{p.desc}</span>
                  </div>
                </SelectItem>
              ))}
              <SelectItem value="__custom__" className="text-xs">Custom group...</SelectItem>
            </SelectContent>
          </Select>
          {isCustomHistoryGroup && (
            <Input
              value={draft.history_group ?? ''}
              onChange={(e) => update('history_group', e.target.value || null)}
              placeholder="custom-group-name"
              className="h-7 text-xs font-mono mt-1.5"
              autoFocus
            />
          )}
        </Field>

        <Field label="Output Retries" help={
          <HelpTooltip title="Output Retries">
            <HelpSection title="What is this?">
              <p>How many times to retry if structured output validation fails.</p>
            </HelpSection>
          </HelpTooltip>
        }>
          <div className="flex items-center gap-2">
            <Input
              type="number" min={0} max={10}
              value={draft.output_retries ?? 3}
              onChange={(e) => update('output_retries', e.target.value ? Number(e.target.value) : undefined)}
              className="h-8 text-xs font-mono w-20"
            />
            <div className="flex gap-1">
              {[1, 3, 5].map((n) => (
                <Button
                  key={n}
                  variant={(draft.output_retries ?? 3) === n ? 'default' : 'outline'}
                  size="sm" className="h-7 text-[10px] px-2 font-mono"
                  onClick={() => update('output_retries', n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>
        </Field>
      </div>
    </Section>
  );
}
