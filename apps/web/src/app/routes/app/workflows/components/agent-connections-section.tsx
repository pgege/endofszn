import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Plug } from 'lucide-react';
import { Section, Field, TagList } from './config-sheet-primitives';
import { HelpTooltip, HelpSection } from './help-tooltip';
import type { AgentDefinition } from '@/types/workflow';
import { useMcpServers } from '@/lib/api/mcp-servers';

interface AgentConnectionsSectionProps {
  draft: AgentDefinition;
  update: <K extends keyof AgentDefinition>(key: K, value: AgentDefinition[K]) => void;
  name: string;
  allAgentNames: string[];
  allSubWorkflowNames: string[];
}

export function AgentConnectionsSection({
  draft, update, name, allAgentNames, allSubWorkflowNames,
}: AgentConnectionsSectionProps) {
  const { data: mcpData } = useMcpServers();
  const registeredServers = mcpData?.servers ?? [];
  const [newMcpServer, setNewMcpServer] = useState('');
  const [newCallableAgent, setNewCallableAgent] = useState('');
  const [newCallableWorkflow, setNewCallableWorkflow] = useState('');

  const addMcpServer = () => {
    const val = newMcpServer.trim();
    if (!val) return;
    const current = draft.mcp_servers || [];
    if (current.includes(val)) return;
    update('mcp_servers', [...current, val]);
    setNewMcpServer('');
  };

  const addCallableAgent = () => {
    const val = newCallableAgent.trim();
    if (!val) return;
    const current = draft.can_call_agents || [];
    if (current.includes(val)) return;
    update('can_call_agents', [...current, val]);
    setNewCallableAgent('');
  };

  const addCallableWorkflow = () => {
    const val = newCallableWorkflow.trim();
    if (!val) return;
    const current = draft.can_call_workflows || [];
    if (current.includes(val)) return;
    update('can_call_workflows', [...current, val]);
    setNewCallableWorkflow('');
  };

  return (
    <Section icon={Plug} title="Connections" defaultOpen={!!(draft.mcp_servers?.length || draft.can_call_agents?.length || draft.can_call_workflows?.length)}>
      <div className="space-y-4">
        <Field label="MCP Servers" help={
          <HelpTooltip title="MCP Servers">
            <HelpSection title="What is this?">
              <p>MCP servers provide tools the agent can use during execution.</p>
            </HelpSection>
          </HelpTooltip>
        }>
          <TagList
            items={draft.mcp_servers || []}
            onRemove={(s) => {
              const updated = (draft.mcp_servers || []).filter((x) => x !== s);
              update('mcp_servers', updated.length > 0 ? updated : undefined);
            }}
          />
          {registeredServers.filter((s) => !(draft.mcp_servers || []).includes(s)).length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Select value={newMcpServer} onValueChange={setNewMcpServer}>
                <SelectTrigger className="h-8 text-xs font-mono flex-1"><SelectValue placeholder="Select server..." /></SelectTrigger>
                <SelectContent>
                  {registeredServers.filter((s) => !(draft.mcp_servers || []).includes(s)).map((s) => (
                    <SelectItem key={s} value={s} className="text-xs font-mono">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={addMcpServer} disabled={!newMcpServer}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </Field>

        <Field label="Can Call Agents" help={
          <HelpTooltip title="Callable Agents">
            <HelpSection title="What is this?">
              <p>Other agents this agent can delegate to as tools.</p>
            </HelpSection>
          </HelpTooltip>
        }>
          <TagList
            items={draft.can_call_agents || []}
            onRemove={(a) => {
              const updated = (draft.can_call_agents || []).filter((x) => x !== a);
              update('can_call_agents', updated.length > 0 ? updated : undefined);
            }}
          />
          <div className="flex items-center gap-2 mt-2">
            <Select value={newCallableAgent} onValueChange={setNewCallableAgent}>
              <SelectTrigger className="h-8 text-xs font-mono flex-1"><SelectValue placeholder="Select agent..." /></SelectTrigger>
              <SelectContent>
                {allAgentNames.filter((a) => a !== name && !(draft.can_call_agents || []).includes(a)).map((a) => (
                  <SelectItem key={a} value={a} className="text-xs font-mono">{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={addCallableAgent} disabled={!newCallableAgent}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </Field>

        {allSubWorkflowNames.length > 0 && (
          <Field label="Callable Sub-Workflows" help={
            <HelpTooltip title="Callable Sub-Workflows">
              <HelpSection title="What is this?">
                <p>Sub-workflows this agent can invoke as tools.</p>
              </HelpSection>
            </HelpTooltip>
          }>
            <TagList
              items={draft.can_call_workflows || []}
              onRemove={(w) => {
                const updated = (draft.can_call_workflows || []).filter((x) => x !== w);
                update('can_call_workflows', updated.length > 0 ? updated : undefined);
              }}
            />
            <div className="flex items-center gap-2 mt-2">
              <Select value={newCallableWorkflow} onValueChange={setNewCallableWorkflow}>
                <SelectTrigger className="h-8 text-xs font-mono flex-1"><SelectValue placeholder="Select sub-workflow..." /></SelectTrigger>
                <SelectContent>
                  {allSubWorkflowNames.filter((w) => !(draft.can_call_workflows || []).includes(w)).map((w) => (
                    <SelectItem key={w} value={w} className="text-xs font-mono">{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={addCallableWorkflow} disabled={!newCallableWorkflow}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </Field>
        )}
      </div>
    </Section>
  );
}
