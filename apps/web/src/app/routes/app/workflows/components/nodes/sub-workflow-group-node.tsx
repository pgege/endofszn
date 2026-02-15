import { memo, useState } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { Workflow, ChevronDown, ChevronRight, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SubWorkflowGroupData = {
  label: string;
  subWorkflowName: string;
  description: string;
  stepCount: number;
  width: number;
  height: number;
  collapsedWidth: number;
  collapsedHeight: number;
  onOpenConfig?: (name: string) => void;
};

function SubWorkflowGroupNodeComponent({ id, data }: NodeProps) {
  const {
    label,
    subWorkflowName,
    description,
    stepCount,
    width,
    height,
    collapsedWidth,
    collapsedHeight,
    onOpenConfig,
  } = data as unknown as SubWorkflowGroupData;

  const [collapsed, setCollapsed] = useState(false);
  const { fitView } = useReactFlow();

  const currentWidth = collapsed ? (collapsedWidth || 260) : width;
  const currentHeight = collapsed ? (collapsedHeight || 80) : height;

  const handleZoomToFocus = () => {
    fitView({
      nodes: [{ id }],
      padding: 0.3,
      duration: 300,
    });
  };

  return (
    <div
      className="border-2 border-primary/30 bg-primary/[0.02] relative"
      style={{ width: currentWidth, height: currentHeight }}
    >
      <Handle type="target" position={Position.Left} className="!bg-primary !w-2.5 !h-2.5" />

      <div className="absolute -top-4 left-3 flex items-center gap-1.5 bg-background px-2.5 py-1 border border-primary/30 shadow-sm">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1 hover:opacity-70 transition-opacity"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3 text-primary" />
          ) : (
            <ChevronDown className="h-3 w-3 text-primary" />
          )}
          <Workflow className="h-3 w-3 text-primary" />
          <span className="text-xs font-semibold text-primary">{label}</span>
        </button>
        <span className="text-[10px] text-muted-foreground ml-1">{stepCount} steps</span>
        {!collapsed && (
          <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={handleZoomToFocus}>
            <Maximize2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
        {onOpenConfig && (
          <button
            onClick={() => onOpenConfig(subWorkflowName)}
            className="text-[10px] text-primary/70 hover:text-primary ml-1 underline"
          >
            configure
          </button>
        )}
      </div>

      {collapsed && (
        <div className="flex items-center justify-center h-full px-4">
          <p className="text-xs text-muted-foreground text-center line-clamp-2">
            {description || `${stepCount} steps`}
          </p>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-primary !w-2.5 !h-2.5" />
    </div>
  );
}

export const SubWorkflowGroupNode = memo(SubWorkflowGroupNodeComponent);
