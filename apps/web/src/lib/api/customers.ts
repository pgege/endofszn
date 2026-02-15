import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export interface Customer {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  has_account: boolean
  created_at: string
  updated_at: string
}

export interface CustomerListResponse {
  customers: Customer[]
  count: number
  limit: number
  offset: number
}

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (storeId: string, params?: Record<string, any>) => [...customerKeys.lists(), storeId, params ?? {}] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (storeId: string, customerId: string) => [...customerKeys.details(), storeId, customerId] as const,
}

export function useCustomers(storeId: string, params?: { id?: string[]; limit?: number; offset?: number; q?: string; order?: string }) {
  return useQuery({
    queryKey: customerKeys.list(storeId, params),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.id) params.id.forEach(id => searchParams.append('id', id))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.offset) searchParams.set('offset', String(params.offset))
      if (params?.q) searchParams.set('q', params.q)
      if (params?.order) searchParams.set('order', params.order)
      const qs = searchParams.toString()
      return api.get<CustomerListResponse>(`/api/stores/${storeId}/customers${qs ? `?${qs}` : ''}`)
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 2,
  })
}
