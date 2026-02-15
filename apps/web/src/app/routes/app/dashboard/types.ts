import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'

export type WidgetSize = 'sm' | 'md' | 'lg'

export type WidgetType =
  | 'stores-list'
  | 'aggregate-kpi'
  | 'recent-activity'
  | 'quick-actions'
  | 'order-stats'
  | 'revenue-chart'

export interface WidgetConfig {
  id: string
  type: WidgetType
  size: WidgetSize
  settings?: Record<string, unknown>
}

export interface GridPosition {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

export interface DashboardLayout {
  name: string
  widgets: WidgetConfig[]
  grid: GridPosition[]
}

export interface WidgetProps {
  size: WidgetSize
}

export interface WidgetRegistryEntry {
  component: ComponentType<WidgetProps>
  title: string
  description: string
  icon: LucideIcon
  defaultSize: WidgetSize
  sizes: WidgetSize[]
}
