import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export interface OrderItem {
  id: string
  title: string
  product_id: string
  variant_id: string
  quantity: number
  unit_price: number
  thumbnail?: string
}

export interface Order {
  id: string
  display_id: number
  status: string
  currency_code: string
  total: number
  subtotal: number
  tax_total: number
  shipping_total: number
  discount_total: number
  email: string
  items?: OrderItem[]
  shipping_address?: Record<string, any>
  billing_address?: Record<string, any>
  fulfillments?: any[]
  created_at: string
  updated_at: string
}

export interface OrderListResponse {
  orders: Order[]
  count: number
  limit: number
  offset: number
}

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (storeId: string, params?: Record<string, any>) => [...orderKeys.lists(), storeId, params ?? {}] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (storeId: string, orderId: string) => [...orderKeys.details(), storeId, orderId] as const,
}

export function useOrders(storeId: string, params?: { id?: string[]; limit?: number; offset?: number; q?: string; order?: string; status?: string[] }) {
  return useQuery({
    queryKey: orderKeys.list(storeId, params),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.id) params.id.forEach(id => searchParams.append('id', id))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.offset) searchParams.set('offset', String(params.offset))
      if (params?.q) searchParams.set('q', params.q)
      if (params?.order) searchParams.set('order', params.order)
      if (params?.status) params.status.forEach(v => searchParams.append('status', v))
      const qs = searchParams.toString()
      return api.get<OrderListResponse>(`/api/stores/${storeId}/orders${qs ? `?${qs}` : ''}`)
    },
    enabled: !!storeId,
    staleTime: 1000 * 60,
  })
}

export function useCreateFulfillment(storeId: string, orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { items?: Array<{ id: string; quantity: number }>; tracking_number?: string; tracking_url?: string; note?: string }) => {
      return api.post(`/api/stores/${storeId}/orders/${orderId}/fulfillments`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(storeId, orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

export function useCancelOrder(storeId: string, orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      return api.post(`/api/stores/${storeId}/orders/${orderId}/cancel`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(storeId, orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}
