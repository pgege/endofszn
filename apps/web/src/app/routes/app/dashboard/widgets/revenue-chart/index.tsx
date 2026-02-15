import { TrendingUp } from 'lucide-react'
import type { WidgetProps } from '../../types'
import { WidgetLoadingState, WidgetEmptyState } from '../../components/primitives/widget-states'
import { RevenueProvider } from './context'
import { useRevenueData } from './use-revenue-data'
import { SmallVariant } from './variants/SmallVariant'
import { MediumVariant } from './variants/MediumVariant'

export function RevenueChartWidget({ size }: WidgetProps) {
  const data = useRevenueData()

  if (data.isLoading) return <WidgetLoadingState />
  if (data.totalOrders === 0) return <WidgetEmptyState message="No revenue data yet" icon={TrendingUp} />

  return (
    <RevenueProvider value={data}>
      {size === 'sm' && <SmallVariant />}
      {(size === 'md' || size === 'lg') && <MediumVariant />}
    </RevenueProvider>
  )
}
