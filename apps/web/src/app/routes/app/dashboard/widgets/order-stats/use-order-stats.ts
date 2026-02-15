import { useStores } from '@/lib/api/auth'
import { useQueries } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { orderKeys, type OrderListResponse } from '@/lib/api/orders'

export function useOrderStats() {
  const { data: storesData, isLoading: storesLoading } = useStores()
  const stores = storesData?.stores ?? []

  const orderQueries = useQueries({
    queries: stores.map((store) => ({
      queryKey: orderKeys.list(store.id, { limit: 100, offset: 0, purpose: 'stats' }),
      queryFn: async () => {
        return api.get<OrderListResponse>(
          `/api/stores/${store.id}/orders?limit=100&offset=0`
        )
      },
      enabled: !!store.id,
      staleTime: 1000 * 60 * 2,
    })),
  })

  const isLoading = storesLoading || orderQueries.some((q) => q.isLoading)

  const allOrders = orderQueries.flatMap((q) => q.data?.orders || [])
  const totalOrders = allOrders.length
  const pendingOrders = allOrders.filter((o) => o.status === 'pending').length
  const completedOrders = allOrders.filter((o) => o.status === 'completed').length
  const canceledOrders = allOrders.filter((o) => o.status === 'canceled').length

  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const currency = allOrders[0]?.currency_code || 'usd'

  return { totalOrders, pendingOrders, completedOrders, canceledOrders, totalRevenue, currency, isLoading }
}
