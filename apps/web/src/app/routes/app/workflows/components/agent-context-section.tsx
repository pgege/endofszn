import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, X, BookOpen } from 'lucide-react';
import { Section, Field, TagList } from './config-sheet-primitives';
import { HelpTooltip, HelpSection, HelpCode } from './help-tooltip';
import type { AgentDefinition, ContextField } from '@/types/workflow';

interface AgentContextSectionProps {
  draft: AgentDefinition;
  update: <K extends keyof AgentDefinition>(key: K, value: AgentDefinition[K]) => void;
  contextKeySuggestions: string[];
}

export function AgentContextSection({
  draft, update, contextKeySuggestions,
}: AgentContextSectionProps) {
  const [newContextRead, setNewContextRead] = useState('');
  const [newContextWriteKey, setNewContextWriteKey] = useState('');
  const [newContextWriteType, setNewContextWriteType] = useState<ContextField['type']>('string');
  const [newContextWriteDesc, setNewContextWriteDesc] = useState('');

  const availableContextReadSuggestions = contextKeySuggestions.filter(
    (k) => !(draft.context_reads || []).includes(k)
  );

  const addContextRead = () => {
    const val = newContextRead.trim();
    if (!val) return;
    const current = draft.context_reads || [];
    if (current.includes(val)) return;
    update('context_reads', [...current, val]);
    setNewContextRead('');
  };

  const addContextWrite = () => {
    const key = newContextWriteKey.trim();
    if (!key) return;
    update('context_writes', {
      ...(draft.context_writes || {}),
      [key]: { type: newContextWriteType, description: newContextWriteDesc || undefined },
    });
    setNewContextWriteKey('');
    setNewContextWriteDesc('');
    setNewContextWriteType('string');
  };

  return (
    <Section icon={BookOpen} title="Context" defaultOpen={!!(draft.context_reads?.length || draft.context_writes)}>
      <div className="space-y-4">
        <Field label="Context Reads" help={
          <HelpTooltip title="Context Reads">
            <HelpSection title="What is this?">
              <p>Keys from the shared workflow context this agent can read.</p>
            </HelpSection>
            <HelpSection title="Example">
              <HelpCode>{`context_reads:\n  - user_sentiment`}</HelpCode>
            </HelpSection>
          </HelpTooltip>
        }>
          <TagList
            items={draft.context_reads || []}
            onRemove={(key) => {
              const updated = (draft.context_reads || []).filter((k) => k !== key);
              update('context_reads', updated.length > 0 ? updated : undefined);
            }}
          />
          <div className="flex items-center gap-2 mt-2">
            {availableContextReadSuggestions.length > 0 ? (
              <Select value={newContextRead} onValueChange={setNewContextRead}>
                <SelectTrigger className="h-8 text-xs font-mono flex-1"><SelectValue placeholder="Select or type context key..." /></SelectTrigger>
                <SelectContent>
                  {availableContextReadSuggestions.map((k) => (
                    <SelectItem key={k} value={k} className="text-xs font-mono">{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={newContextRead}
                onChange={(e) => setNewContextRead(e.target.value)}
                placeholder="context-key"
                className="h-8 text-xs font-mono flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addContextRead(); } }}
              />
            )}
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={addContextRead} disabled={!newContextRead.trim()}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </Field>

        <Field label="Context Writes" help={
          <HelpTooltip title="Context Writes">
            <HelpSection title="What is this?">
              <p>Keys this agent can write to the shared context for other agents to read.</p>
            </HelpSection>
          </HelpTooltip>
        }>
          {draft.context_writes && Object.keys(draft.context_writes).length > 0 && (
            <div className="space-y-1.5 mb-2">
              {Object.entries(draft.context_writes).map(([key, field]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className="font-mono flex-1 truncate">{key}</span>
                  <Badge variant="outline" className="text-[10px]">{field.type}</Badge>
                  {field.description && <span className="text-muted-foreground truncate max-w-[120px]">{field.description}</span>}
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => {
                    const updated = { ...(draft.context_writes || {}) };
                    delete updated[key];
                    update('context_writes', Object.keys(updated).length > 0 ? updated : undefined);
                  }}>
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Input value={newContextWriteKey} onChange={(e) => setNewContextWriteKey(e.target.value)} placeholder="key" className="h-8 text-xs font-mono w-1/3" />
            <Select value={newContextWriteType} onValueChange={(v) => setNewContextWriteType(v as ContextField['type'])}>
              <SelectTrigger className="h-8 text-xs w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['string', 'number', 'boolean', 'array', 'object'].map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={newContextWriteDesc} onChange={(e) => setNewContextWriteDesc(e.target.value)} placeholder="description" className="h-8 text-xs flex-1" />
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={addContextWrite} disabled={!newContextWriteKey.trim()}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </Field>
      </div>
    </Section>
  );
}
