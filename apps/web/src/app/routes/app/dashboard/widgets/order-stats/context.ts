import { createContext, useContext } from 'react'

interface OrderStatsData {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  canceledOrders: number
  totalRevenue: number
  currency: string
  isLoading: boolean
}

const OrderStatsContext = createContext<OrderStatsData | null>(null)

export const OrderStatsProvider = OrderStatsContext.Provider

export function useOrderStatsContext() {
  const ctx = useContext(OrderStatsContext)
  if (!ctx) throw new Error('useOrderStatsContext must be used within OrderStatsProvider')
  return ctx
}
