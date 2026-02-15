import type { DashboardLayout, WidgetSize } from './types'

export const GRID_COLS = 6
export const GRID_ROW_HEIGHT = 120
export const GRID_MARGIN: [number, number] = [16, 16]

export const SIZE_PRESETS: Record<WidgetSize, { minW: number; minH: number; defaultW: number; defaultH: number }> = {
  sm: { minW: 2, minH: 1, defaultW: 2, defaultH: 1 },
  md: { minW: 2, minH: 2, defaultW: 3, defaultH: 2 },
  lg: { minW: 3, minH: 3, defaultW: 6, defaultH: 3 },
}

export const DEFAULT_LAYOUT: DashboardLayout = {
  name: 'Default',
  widgets: [
    { id: 'aggregate-kpi-1', type: 'aggregate-kpi', size: 'sm' },
    { id: 'quick-actions-1', type: 'quick-actions', size: 'sm' },
    { id: 'order-stats-1', type: 'order-stats', size: 'sm' },
    { id: 'stores-list-1', type: 'stores-list', size: 'md' },
    { id: 'recent-activity-1', type: 'recent-activity', size: 'md' },
    { id: 'revenue-chart-1', type: 'revenue-chart', size: 'md' },
  ],
  grid: [
    { i: 'aggregate-kpi-1', x: 0, y: 0, w: 2, h: 1, minW: 2, minH: 1 },
    { i: 'quick-actions-1', x: 2, y: 0, w: 2, h: 1, minW: 2, minH: 1 },
    { i: 'order-stats-1', x: 4, y: 0, w: 2, h: 1, minW: 2, minH: 1 },
    { i: 'stores-list-1', x: 0, y: 1, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'recent-activity-1', x: 3, y: 1, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'revenue-chart-1', x: 0, y: 3, w: 6, h: 2, minW: 2, minH: 2 },
  ],
}
