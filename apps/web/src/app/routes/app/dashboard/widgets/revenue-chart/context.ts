import { createContext, useContext } from 'react'
import type { MonthlyData } from './use-revenue-data'

interface RevenueData {
  monthly: MonthlyData[]
  totalRevenue: number
  totalOrders: number
  currency: string
  isLoading: boolean
}

const RevenueContext = createContext<RevenueData | null>(null)

export const RevenueProvider = RevenueContext.Provider

export function useRevenueContext() {
  const ctx = useContext(RevenueContext)
  if (!ctx) throw new Error('useRevenueContext must be used within RevenueProvider')
  return ctx
}
