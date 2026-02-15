import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import ReactGridLayout from 'react-grid-layout'
import type { DashboardLayout, WidgetSize, GridPosition } from '../types'
import { WIDGET_REGISTRY } from '../registry'
import { GRID_COLS, GRID_ROW_HEIGHT, GRID_MARGIN } from '../constants'
import { WidgetShell } from './widget-shell'

interface WidgetGridProps {
  layout: DashboardLayout
  editMode: boolean
  onGridChange: (grid: GridPosition[]) => void
  onRemoveWidget: (id: string) => void
  onResizeWidget?: (id: string, size: WidgetSize) => void
}

export function WidgetGrid({
  layout,
  editMode,
  onGridChange,
  onRemoveWidget,
  onResizeWidget,
}: WidgetGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const rglLayout = useMemo(
    () =>
      layout.grid.map((g) => ({
        i: g.i,
        x: g.x,
        y: g.y,
        w: g.w,
        h: g.h,
        minW: g.minW,
        minH: g.minH,
      })),
    [layout.grid],
  )

  const persistPositions = useCallback(
    (changedLayout: ReactGridLayout.Layout[]) => {
      const mapped: GridPosition[] = changedLayout.map((item) => {
        const existing = layout.grid.find((g) => g.i === item.i)
        return {
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          minW: existing?.minW,
          minH: existing?.minH,
        }
      })
      onGridChange(mapped)
    },
    [layout.grid, onGridChange],
  )

  return (
    <div ref={containerRef}>
      {width > 0 && (
        <ReactGridLayout
          layout={rglLayout}
          cols={GRID_COLS}
          rowHeight={GRID_ROW_HEIGHT}
          width={width}
          margin={GRID_MARGIN}
          isDraggable={editMode}
          isResizable={editMode}
          draggableHandle=".drag-handle"
          compactType="vertical"
          onDragStop={persistPositions}
          onResizeStop={persistPositions}
          useCSSTransforms
        >
          {layout.widgets.map((widget) => {
            const entry = WIDGET_REGISTRY[widget.type]
            if (!entry) return null
            const Component = entry.component
            return (
              <div key={widget.id}>
                <WidgetShell
                  title={entry.title}
                  size={widget.size}
                  icon={entry.icon}
                  editMode={editMode}
                  onRemove={() => onRemoveWidget(widget.id)}
                  onResize={onResizeWidget ? (s) => onResizeWidget(widget.id, s) : undefined}
                  availableSizes={entry.sizes}
                >
                  <Component size={widget.size} />
                </WidgetShell>
              </div>
            )
          })}
        </ReactGridLayout>
      )}
    </div>
  )
}
