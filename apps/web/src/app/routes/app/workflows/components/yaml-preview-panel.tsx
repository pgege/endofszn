import { useState } from 'react';
import { Code } from 'lucide-react';
import { DragResizeHandle } from './drag-resize-handle';
import { CodeEditor } from './code-editor';

interface YamlPreviewPanelProps {
  value: string;
  onChange?: (value: string) => void;
  label?: string;
  hint?: string;
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
}

export function YamlPreviewPanel({
  value,
  onChange,
  label = 'YAML Preview',
  hint,
  defaultHeight = 200,
  minHeight = 60,
  maxHeight = 600,
}: YamlPreviewPanelProps) {
  const [height, setHeight] = useState(defaultHeight);

  return (
    <>
      <DragResizeHandle onResize={(delta) => setHeight((h) => Math.max(minHeight, Math.min(maxHeight, h + delta)))} />
      <div className="shrink-0 flex flex-col" style={{ height }}>
        <div className="px-4 py-1.5 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Code className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
          </div>
          {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
        </div>
        <div className="flex-1 min-h-0">
          <CodeEditor value={value} onChange={onChange} language="yaml" height="100%" readOnly={!onChange} />
        </div>
      </div>
    </>
  );
}
