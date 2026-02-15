import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Layers } from 'lucide-react';

type BatchGroupData = {
  label: string;
  stepCount: number;
  width: number;
  height: number;
};

function BatchGroupNodeComponent({ data }: NodeProps) {
  const { label, width, height } = data as unknown as BatchGroupData;

  return (
    <div
      className="border-2 border-dashed border-muted-foreground/30 bg-muted/5"
      style={{ width, height }}
    >
      <div className="absolute -top-3 left-3 flex items-center gap-1 bg-background px-2 py-0.5 border border-muted-foreground/20">
        <Layers className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
    </div>
  );
}

export const BatchGroupNode = memo(BatchGroupNodeComponent);
