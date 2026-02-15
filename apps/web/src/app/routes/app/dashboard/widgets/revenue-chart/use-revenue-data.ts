import { useStores } from '@/lib/api/auth'
import { useQueries } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { orderKeys, type OrderListResponse } from '@/lib/api/orders'

export interface MonthlyData {
  month: string
  label: string
  orders: number
  revenue: number
}

export function useRevenueData() {
  const { data: storesData, isLoading: storesLoading } = useStores()
  const stores = storesData?.stores ?? []

  const orderQueries = useQueries({
    queries: stores.map((store) => ({
      queryKey: orderKeys.list(store.id, { limit: 100, offset: 0, purpose: 'revenue' }),
      queryFn: async () => {
        return api.get<OrderListResponse>(
          `/api/stores/${store.id}/orders?limit=100&offset=0`
        )
      },
      enabled: !!store.id,
      staleTime: 1000 * 60 * 5,
    })),
  })

  const isLoading = storesLoading || orderQueries.some((q) => q.isLoading)

  const allOrders = orderQueries.flatMap((q) => q.data?.orders || [])
  const currency = allOrders[0]?.currency_code || 'usd'

  const monthMap = new Map<string, { orders: number; revenue: number }>()

  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toISOString().slice(0, 7)
    monthMap.set(key, { orders: 0, revenue: 0 })
  }

  for (const order of allOrders) {
    const key = new Date(order.created_at).toISOString().slice(0, 7)
    const existing = monthMap.get(key)
    if (existing) {
      existing.orders++
      existing.revenue += order.total || 0
    }
  }

  const monthly: MonthlyData[] = Array.from(monthMap.entries()).map(([month, data]) => ({
    month,
    label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    ...data,
  }))

  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const totalOrders = allOrders.length

  return { monthly, totalRevenue, totalOrders, currency, isLoading }
}
