import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export interface PriceList {
  id: string
  title: string
  description: string | null
  status: string
  type: string
  starts_at: string | null
  ends_at: string | null
  prices?: any[]
  created_at: string
}

export interface PriceListResponse {
  price_lists: PriceList[]
  count: number
  limit: number
  offset: number
}

export const priceListKeys = {
  all: ['price-lists'] as const,
  lists: () => [...priceListKeys.all, 'list'] as const,
  list: (storeId: string, params?: Record<string, any>) => [...priceListKeys.lists(), storeId, params ?? {}] as const,
  detail: (storeId: string, priceListId: string) => [...priceListKeys.all, 'detail', storeId, priceListId] as const,
}

export function usePriceLists(storeId: string, params?: { id?: string[]; limit?: number; offset?: number; q?: string; order?: string }) {
  return useQuery({
    queryKey: priceListKeys.list(storeId, params),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.id) params.id.forEach(v => searchParams.append('id', v))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.offset) searchParams.set('offset', String(params.offset))
      if (params?.q) searchParams.set('q', params.q)
      if (params?.order) searchParams.set('order', params.order)
      const qs = searchParams.toString()
      return api.get<PriceListResponse>(`/api/stores/${storeId}/price-lists${qs ? `?${qs}` : ''}`)
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreatePriceList(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post(`/api/stores/${storeId}/price-lists`, [data]),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: priceListKeys.lists() }) },
  })
}

export function useUpdatePriceList(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ priceListId, ...data }: { priceListId: string } & Record<string, any>) =>
      api.put(`/api/stores/${storeId}/price-lists`, [{ id: priceListId, ...data }]),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: priceListKeys.lists() })
      queryClient.invalidateQueries({ queryKey: priceListKeys.detail(storeId, vars.priceListId) })
    },
  })
}

export function useDeletePriceList(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (priceListId: string) =>
      api.delete(`/api/stores/${storeId}/price-lists`, { body: { ids: [priceListId] } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: priceListKeys.lists() }) },
  })
}
