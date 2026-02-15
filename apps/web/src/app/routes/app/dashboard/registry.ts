import { Store, BarChart3, Activity, Zap, ShoppingCart, TrendingUp } from 'lucide-react'
import type { WidgetType, WidgetRegistryEntry } from './types'
import { StoresListWidget } from './widgets/stores-list'
import { AggregateKpiWidget } from './widgets/aggregate-kpi'
import { RecentActivityWidget } from './widgets/recent-activity-v2'
import { QuickActionsWidget } from './widgets/quick-actions-v2'
import { OrderStatsWidget } from './widgets/order-stats'
import { RevenueChartWidget } from './widgets/revenue-chart'

export const WIDGET_REGISTRY: Record<WidgetType, WidgetRegistryEntry> = {
  'stores-list': {
    component: StoresListWidget,
    title: 'Stores',
    description: 'View and manage all your stores',
    icon: Store,
    defaultSize: 'md',
    sizes: ['sm', 'md', 'lg'],
  },
  'aggregate-kpi': {
    component: AggregateKpiWidget,
    title: 'KPIs',
    description: 'Aggregated metrics across all stores',
    icon: BarChart3,
    defaultSize: 'sm',
    sizes: ['sm', 'md'],
  },
  'recent-activity': {
    component: RecentActivityWidget,
    title: 'Recent Activity',
    description: 'Live feed of store changes',
    icon: Activity,
    defaultSize: 'md',
    sizes: ['sm', 'md'],
  },
  'quick-actions': {
    component: QuickActionsWidget,
    title: 'Quick Actions',
    description: 'Shortcuts to common tasks',
    icon: Zap,
    defaultSize: 'sm',
    sizes: ['sm', 'md'],
  },
  'order-stats': {
    component: OrderStatsWidget,
    title: 'Order Stats',
    description: 'Order summary with status breakdown',
    icon: ShoppingCart,
    defaultSize: 'sm',
    sizes: ['sm', 'md'],
  },
  'revenue-chart': {
    component: RevenueChartWidget,
    title: 'Revenue',
    description: 'Revenue trends over time',
    icon: TrendingUp,
    defaultSize: 'md',
    sizes: ['sm', 'md'],
  },
}
