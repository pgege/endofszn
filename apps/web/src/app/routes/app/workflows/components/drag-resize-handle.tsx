import { useCallback, useRef, useState } from 'react';
import { GripHorizontal } from 'lucide-react';

interface DragResizeHandleProps {
  onResize: (delta: number) => void;
}

export function DragResizeHandle({ onResize }: DragResizeHandleProps) {
  const [dragging, setDragging] = useState(false);
  const lastY = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      lastY.current = e.clientY;
      setDragging(true);

      const handleMouseMove = (ev: MouseEvent) => {
        const delta = lastY.current - ev.clientY;
        lastY.current = ev.clientY;
        onResize(delta);
      };

      const handleMouseUp = () => {
        setDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [onResize]
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`shrink-0 flex items-center justify-center h-2 cursor-row-resize border-y border-border transition-colors ${
        dragging ? 'bg-primary/20' : 'hover:bg-muted/80'
      }`}
    >
      <GripHorizontal className="h-3 w-3 text-muted-foreground" />
    </div>
  );
}
