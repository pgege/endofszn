import { useState, useRef } from 'react';
import { Bot, Plus, Server, Wrench, Pencil, Trash2, Workflow, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AgentDefinition, SubWorkflowDefinition } from '@/types/workflow';

interface AgentsBarProps {
  agents: Record<string, AgentDefinition>;
  subWorkflows?: Record<string, SubWorkflowDefinition>;
  onSelectAgent: (name: string) => void;
  onAddAgent: (name: string, agent: AgentDefinition) => void;
  onRemoveAgent: (name: string) => void;
  onSelectSubWorkflow?: (name: string) => void;
  onAddSubWorkflow?: (name: string, subWf: SubWorkflowDefinition) => void;
  onRemoveSubWorkflow?: (name: string) => void;
}

export function AgentsBar({
  agents,
  subWorkflows,
  onSelectAgent,
  onAddAgent,
  onRemoveAgent,
  onSelectSubWorkflow,
  onAddSubWorkflow,
  onRemoveSubWorkflow,
}: AgentsBarProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [addingSubWf, setAddingSubWf] = useState(false);
  const [newSubWfName, setNewSubWfName] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const agentNames = Object.keys(agents);
  const subWfNames = Object.keys(subWorkflows || {});

  const handleAdd = () => {
    const name = newName.trim();
    if (!name || agents[name]) return;
    onAddAgent(name, { description: '', system_prompt: '' });
    setNewName('');
    setAdding(false);
    onSelectAgent(name);
  };

  const handleAddSubWf = () => {
    const name = newSubWfName.trim();
    if (!name || !onAddSubWorkflow) return;
    if (subWorkflows?.[name]) return;
    onAddSubWorkflow(name, { description: '', steps: [], output: '' });
    setNewSubWfName('');
    setAddingSubWf(false);
    onSelectSubWorkflow?.(name);
  };

  return (
    <div className="border-b bg-muted/10">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <div className="flex items-center gap-1.5 shrink-0">
          <Bot className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">Agents</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {agentNames.length}
          </Badge>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-border"
        >
          <div className="flex items-stretch gap-2 py-1">
            {agentNames.map((name) => {
              const agent = agents[name];
              const mcpServers = agent.mcp_servers || [];
              const toolAgents = agent.can_call_agents || [];

              return (
                <div
                  key={name}
                  className="flex flex-col gap-1 p-2 border border-border bg-card hover:border-primary/50 transition-colors group cursor-pointer shrink-0 min-w-[160px] max-w-[220px]"
                  onClick={() => onSelectAgent(name)}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <Bot className="h-3 w-3 text-primary shrink-0" />
                      <span className="text-[11px] font-mono font-semibold truncate">{name}</span>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                      <button
                        type="button"
                        className="p-0.5 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); onRemoveAgent(name); }}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                  {agent.description && (
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{agent.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1">
                    {agent.model && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">{agent.model}</Badge>
                    )}
                    {mcpServers.map((s) => (
                      <Badge key={s} variant="secondary" className="text-[9px] px-1 py-0 h-3.5 gap-0.5">
                        <Server className="h-2 w-2" />{s}
                      </Badge>
                    ))}
                    {toolAgents.length > 0 && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 gap-0.5">
                        <Wrench className="h-2 w-2" />{toolAgents.length} tool{toolAgents.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}

            {adding && (
              <div className="flex items-center gap-2 p-2 border border-dashed border-primary/50 bg-card shrink-0 min-w-[200px]">
                <Bot className="h-3 w-3 text-primary shrink-0" />
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="agent-name"
                  className="h-6 text-xs font-mono flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
                    if (e.key === 'Escape') { setAdding(false); setNewName(''); }
                  }}
                  autoFocus
                />
                <Button size="sm" className="h-6 text-[10px] px-2" onClick={handleAdd} disabled={!newName.trim() || !!agents[newName.trim()]}>
                  Create
                </Button>
              </div>
            )}

            {agentNames.length === 0 && !adding && (
              <p className="text-[10px] text-muted-foreground py-1">No agents defined.</p>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[11px] px-2 shrink-0"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3 w-3 mr-0.5" />
          Add
        </Button>
      </div>

      {(subWfNames.length > 0 || onAddSubWorkflow) && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-border/50">
          <div className="flex items-center gap-1.5 shrink-0">
            <Workflow className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium">Sub-Workflows</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {subWfNames.length}
            </Badge>
          </div>

          <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-border">
            <div className="flex items-stretch gap-2 py-1">
              {subWfNames.map((name) => {
                const subWf = subWorkflows![name];
                return (
                  <div
                    key={name}
                    className="flex flex-col gap-1 p-2 border border-primary/20 bg-primary/[0.02] hover:border-primary/50 transition-colors group cursor-pointer shrink-0 min-w-[160px] max-w-[220px]"
                    onClick={() => onSelectSubWorkflow?.(name)}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <Workflow className="h-3 w-3 text-primary shrink-0" />
                        <span className="text-[11px] font-mono font-semibold truncate">{name}</span>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                        {onRemoveSubWorkflow && (
                          <button
                            type="button"
                            className="p-0.5 hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); onRemoveSubWorkflow(name); }}
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {subWf.description && (
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{subWf.description}</p>
                    )}
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 gap-0.5">
                        <Layers className="h-2 w-2" />
                        {subWf.steps.length} step{subWf.steps.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                );
              })}

              {addingSubWf && (
                <div className="flex items-center gap-2 p-2 border border-dashed border-primary/50 bg-card shrink-0 min-w-[200px]">
                  <Workflow className="h-3 w-3 text-primary shrink-0" />
                  <Input
                    value={newSubWfName}
                    onChange={(e) => setNewSubWfName(e.target.value)}
                    placeholder="sub-workflow-name"
                    className="h-6 text-xs font-mono flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddSubWf(); }
                      if (e.key === 'Escape') { setAddingSubWf(false); setNewSubWfName(''); }
                    }}
                    autoFocus
                  />
                  <Button size="sm" className="h-6 text-[10px] px-2" onClick={handleAddSubWf} disabled={!newSubWfName.trim() || !!subWorkflows?.[newSubWfName.trim()]}>
                    Create
                  </Button>
                </div>
              )}

              {subWfNames.length === 0 && !addingSubWf && (
                <p className="text-[10px] text-muted-foreground py-1">No sub-workflows defined.</p>
              )}
            </div>
          </div>

          {onAddSubWorkflow && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-2 shrink-0"
              onClick={() => setAddingSubWf(true)}
            >
              <Plus className="h-3 w-3 mr-0.5" />
              Add
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
