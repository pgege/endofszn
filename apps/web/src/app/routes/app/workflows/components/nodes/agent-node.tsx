import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Bot, Server, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AgentDefinition } from '@/types/workflow';

type AgentNodeData = {
  name: string;
  agent: AgentDefinition;
};

function AgentNodeComponent({ data }: NodeProps) {
  const { name, agent } = data as unknown as AgentNodeData;
  const mcpCount = agent.mcp_servers?.length || 0;
  const toolCount = agent.can_call_agents?.length || 0;

  return (
    <div className="bg-card border-2 border-dashed border-muted-foreground/30 shadow-sm px-4 py-3 min-w-[200px] max-w-[220px] hover:border-primary/50 transition-colors cursor-pointer">
      <div className="flex items-center gap-2 mb-1.5">
        <Bot className="h-4 w-4 text-primary shrink-0" />
        <span className="font-semibold text-sm truncate">{name}</span>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
        {agent.description}
      </p>

      <div className="flex flex-wrap gap-1">
        {mcpCount > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            <Server className="h-2.5 w-2.5 mr-0.5" />
            {agent.mcp_servers?.join(', ')}
          </Badge>
        )}
        {toolCount > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            <Wrench className="h-2.5 w-2.5 mr-0.5" />
            {toolCount} tool{toolCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
