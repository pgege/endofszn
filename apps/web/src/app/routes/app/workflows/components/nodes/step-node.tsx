import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Timer,
  RotateCcw,
  GitBranch,
  Layers,
  AlertTriangle,
  Workflow,
  Bot,
  Server,
  Wrench,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { WorkflowStep, AgentDefinition } from '@/types/workflow';

type StepNodeData = {
  step: WorkflowStep;
  agentDef?: AgentDefinition;
};

function StepNodeComponent({ data }: NodeProps) {
  const { step, agentDef } = data as unknown as StepNodeData;
  const hasCondition = !!step.if;
  const hasRetry = !!step.retry;
  const hasTimeout = !!step.timeout;
  const hasStrategy = !!step.strategy;
  const hasSubWorkflow = !!step.sub_workflow;

  const strategyLabel = step.strategy?.type || '';
  const mcpServers = agentDef?.mcp_servers || [];
  const toolCount = agentDef?.can_call_agents?.length || 0;

  return (
    <div className="bg-card border-2 border-border shadow-sm min-w-[240px] max-w-[300px] hover:border-primary/50 transition-colors cursor-pointer overflow-hidden">
      <Handle type="target" position={Position.Left} className="!bg-primary !w-2 !h-2" />

      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm truncate">{step.id}</span>
          {step.continue_on_error && (
            <AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0 ml-1" />
          )}
        </div>

        {hasSubWorkflow && (
          <p className="text-xs text-blue-500 flex items-center gap-1 mb-2">
            <Workflow className="h-3 w-3" />
            Sub-workflow: {step.sub_workflow}
          </p>
        )}

        <div className="flex flex-wrap gap-1 mb-0.5">
          {hasCondition && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              <GitBranch className="h-2.5 w-2.5 mr-0.5" />
              if
            </Badge>
          )}
          {hasStrategy && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              <Layers className="h-2.5 w-2.5 mr-0.5" />
              {strategyLabel}
            </Badge>
          )}
          {hasRetry && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              <RotateCcw className="h-2.5 w-2.5 mr-0.5" />
              {step.retry?.max_attempts}x
            </Badge>
          )}
          {hasTimeout && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              <Timer className="h-2.5 w-2.5 mr-0.5" />
              {step.timeout}s
            </Badge>
          )}
        </div>
      </div>

      {step.agent && (
        <div className="border-t border-dashed border-border bg-muted/30 px-4 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Bot className="h-3 w-3 text-primary shrink-0" />
            <span className="text-xs font-medium truncate">{step.agent}</span>
          </div>
          {agentDef?.description && (
            <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1.5">
              {agentDef.description}
            </p>
          )}
          {(mcpServers.length > 0 || toolCount > 0) && (
            <div className="flex flex-wrap gap-1">
              {mcpServers.map((s) => (
                <Badge key={s} variant="secondary" className="text-[9px] px-1 py-0 gap-0.5">
                  <Server className="h-2 w-2" />
                  {s}
                </Badge>
              ))}
              {toolCount > 0 && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 gap-0.5">
                  <Wrench className="h-2 w-2" />
                  {toolCount} agent{toolCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-primary !w-2 !h-2" />
    </div>
  );
}

export const StepNode = memo(StepNodeComponent);
