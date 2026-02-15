import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export interface ShippingOption {
  id: string
  name: string
  price_type: string
  data: Record<string, any>
  metadata: Record<string, any>
  type?: any
  rules?: any[]
  created_at: string
  updated_at: string
}

export interface ShippingListResponse {
  shipping_options: ShippingOption[]
  count: number
  limit: number
  offset: number
}

export const shippingKeys = {
  all: ['shipping'] as const,
  lists: () => [...shippingKeys.all, 'list'] as const,
  list: (storeId: string, params?: Record<string, any>) => [...shippingKeys.lists(), storeId, params ?? {}] as const,
}

export function useShippingOptions(storeId: string, params?: { id?: string[]; limit?: number; offset?: number; q?: string; order?: string }) {
  return useQuery({
    queryKey: shippingKeys.list(storeId, params),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.id) params.id.forEach(v => searchParams.append('id', v))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.offset) searchParams.set('offset', String(params.offset))
      if (params?.q) searchParams.set('q', params.q)
      if (params?.order) searchParams.set('order', params.order)
      const qs = searchParams.toString()
      return api.get<ShippingListResponse>(`/api/stores/${storeId}/shipping${qs ? `?${qs}` : ''}`)
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateShippingOption(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post(`/api/stores/${storeId}/shipping`, [data]),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: shippingKeys.lists() }) },
  })
}

export function useUpdateShippingOption(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ optionId, ...data }: { optionId: string } & Record<string, any>) =>
      api.put(`/api/stores/${storeId}/shipping`, [{ id: optionId, ...data }]),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: shippingKeys.lists() }) },
  })
}

export function useDeleteShippingOption(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (optionId: string) =>
      api.delete(`/api/stores/${storeId}/shipping`, { body: { ids: [optionId] } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: shippingKeys.lists() }) },
  })
}
