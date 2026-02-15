import { BarChart3 } from 'lucide-react'
import type { WidgetProps } from '../../types'
import { WidgetLoadingState, WidgetEmptyState } from '../../components/primitives/widget-states'
import { AggregateKpiProvider } from './context'
import { useAggregateKpi } from './use-aggregate-kpi'
import { SmallVariant } from './variants/SmallVariant'
import { MediumVariant } from './variants/MediumVariant'

export function AggregateKpiWidget({ size }: WidgetProps) {
  const data = useAggregateKpi()

  if (data.isLoading) return <WidgetLoadingState />
  if (data.totalStores === 0) return <WidgetEmptyState message="No stores to aggregate" icon={BarChart3} />

  return (
    <AggregateKpiProvider value={data}>
      {size === 'sm' && <SmallVariant />}
      {(size === 'md' || size === 'lg') && <MediumVariant />}
    </AggregateKpiProvider>
  )
}
