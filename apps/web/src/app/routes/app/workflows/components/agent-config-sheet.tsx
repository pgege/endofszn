import { useMemo } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileJson } from 'lucide-react';
import { Section, Field, ConfigSheetFooter } from './config-sheet-primitives';
import { YamlPreviewPanel } from './yaml-preview-panel';
import { SchemaBuilder } from './schema-builder';
import { HelpTooltip, HelpSection, HelpCode } from './help-tooltip';
import { AgentIdentitySection } from './agent-identity-section';
import { AgentConnectionsSection } from './agent-connections-section';
import { AgentContextSection } from './agent-context-section';
import { DiscardDialog } from './discard-dialog';
import { useDraftState } from '../hooks/use-draft-state';
import type { ExpressionSuggestion } from './expression-input';
import type { AgentDefinition } from '@/types/workflow';

interface AgentConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  agent: AgentDefinition;
  allAgentNames: string[];
  allSubWorkflowNames?: string[];
  suggestions: ExpressionSuggestion[];
  contextKeySuggestions: string[];
  fullYaml: string;
  onUpdate: (agent: AgentDefinition) => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
}

export function AgentConfigSheet({
  open, onOpenChange, name, agent, allAgentNames,
  allSubWorkflowNames = [], suggestions, contextKeySuggestions,
  fullYaml, onUpdate, onRename, onDelete,
}: AgentConfigSheetProps) {
  const {
    draft, setDraft, editingName, setEditingName,
    isDirty, attempted, setAttempted,
    showDiscardDialog, setShowDiscardDialog,
    handleClose, handleDiscard,
  } = useDraftState(agent, name, onOpenChange);

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!draft.description?.trim()) errors.description = 'Description is required';
    if (!draft.system_prompt?.trim()) errors.system_prompt = 'System prompt is required';
    return errors;
  }, [draft]);

  const isValid = Object.keys(validationErrors).length === 0;
  const showError = (field: string) => attempted ? validationErrors[field] : undefined;

  const handleSave = () => {
    setAttempted(true);
    if (!isValid) return;
    onUpdate(draft);
    const trimmedName = editingName.trim();
    if (trimmedName && trimmedName !== name && !allAgentNames.includes(trimmedName)) {
      onRename(trimmedName);
    }
    setAttempted(false);
    onOpenChange(false);
  };

  const update = <K extends keyof AgentDefinition>(key: K, value: AgentDefinition[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="sm:max-w-3xl w-full p-0! gap-0! h-full flex flex-col overflow-hidden" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => { e.preventDefault(); if (isDirty) setShowDiscardDialog(true); }}>
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>Agent Configuration</SheetTitle>
          </SheetHeader>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-3 p-6">
                <AgentIdentitySection
                  draft={draft} update={update}
                  editingName={editingName} setEditingName={setEditingName}
                  name={name} suggestions={suggestions}
                  showError={showError} validationErrors={validationErrors}
                />

                <AgentConnectionsSection
                  draft={draft} update={update}
                  name={name} allAgentNames={allAgentNames}
                  allSubWorkflowNames={allSubWorkflowNames}
                />

                <Section icon={FileJson} title="Schema" defaultOpen={!!(draft.input_schema || draft.output_schema)}>
                  <div className="space-y-4">
                    <Field label="Input Schema" help={
                      <HelpTooltip title="Input Schema">
                        <HelpSection title="What is this?">
                          <p>Defines the expected format of data passed to this agent.</p>
                        </HelpSection>
                        <HelpSection title="Example">
                          <HelpCode>{`{
  "type": "object",
  "properties": {
    "query": { "type": "string" }
  },
  "required": ["query"]
}`}</HelpCode>
                        </HelpSection>
                      </HelpTooltip>
                    }>
                      <SchemaBuilder
                        value={draft.input_schema}
                        onChange={(schema) => update('input_schema', schema)}
                        label="Input Schema"
                      />
                    </Field>

                    <Field label="Output Schema" help={
                      <HelpTooltip title="Output Schema">
                        <HelpSection title="What is this?">
                          <p>Defines the format the agent must return. Output is validated automatically.</p>
                        </HelpSection>
                      </HelpTooltip>
                    }>
                      <SchemaBuilder
                        value={draft.output_schema}
                        onChange={(schema) => update('output_schema', schema)}
                        label="Output Schema"
                      />
                    </Field>
                  </div>
                </Section>

                <AgentContextSection
                  draft={draft} update={update}
                  contextKeySuggestions={contextKeySuggestions}
                />
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
