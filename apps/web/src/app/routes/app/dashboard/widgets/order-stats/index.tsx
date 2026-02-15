import { ShoppingCart } from 'lucide-react'
import type { WidgetProps } from '../../types'
import { WidgetLoadingState, WidgetEmptyState } from '../../components/primitives/widget-states'
import { OrderStatsProvider } from './context'
import { useOrderStats } from './use-order-stats'
import { SmallVariant } from './variants/SmallVariant'
import { MediumVariant } from './variants/MediumVariant'

export function OrderStatsWidget({ size }: WidgetProps) {
  const data = useOrderStats()

  if (data.isLoading) return <WidgetLoadingState />
  if (data.totalOrders === 0) return <WidgetEmptyState message="No orders yet" icon={ShoppingCart} />

  return (
    <OrderStatsProvider value={data}>
      {size === 'sm' && <SmallVariant />}
      {(size === 'md' || size === 'lg') && <MediumVariant />}
    </OrderStatsProvider>
  )
}
