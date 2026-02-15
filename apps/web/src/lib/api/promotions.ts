import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export interface Promotion {
  id: string
  code: string
  type: string
  status: string
  is_automatic: boolean
  rules?: any[]
  application_method?: any
  created_at: string
  updated_at: string
}

export interface PromotionListResponse {
  promotions: Promotion[]
  count: number
  limit: number
  offset: number
}

export const promotionKeys = {
  all: ['promotions'] as const,
  lists: () => [...promotionKeys.all, 'list'] as const,
  list: (storeId: string, params?: Record<string, any>) => [...promotionKeys.lists(), storeId, params ?? {}] as const,
  detail: (storeId: string, promotionId: string) => [...promotionKeys.all, 'detail', storeId, promotionId] as const,
}

export function usePromotions(storeId: string, params?: { id?: string[]; limit?: number; offset?: number; q?: string; order?: string }) {
  return useQuery({
    queryKey: promotionKeys.list(storeId, params),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.id) params.id.forEach(v => searchParams.append('id', v))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.offset) searchParams.set('offset', String(params.offset))
      if (params?.q) searchParams.set('q', params.q)
      if (params?.order) searchParams.set('order', params.order)
      const qs = searchParams.toString()
      return api.get<PromotionListResponse>(`/api/stores/${storeId}/promotions${qs ? `?${qs}` : ''}`)
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreatePromotion(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post<{ promotion: Promotion }>(`/api/stores/${storeId}/promotions`, [data]),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: promotionKeys.lists() }) },
  })
}

export function useUpdatePromotion(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ promotionId, ...data }: { promotionId: string } & Record<string, any>) =>
      api.put<any>(`/api/stores/${storeId}/promotions`, [{ id: promotionId, ...data }]),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: promotionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: promotionKeys.detail(storeId, vars.promotionId) })
    },
  })
}

export function useDeletePromotion(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (promotionId: string) =>
      api.delete(`/api/stores/${storeId}/promotions`, { body: { ids: [promotionId] } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: promotionKeys.lists() }) },
  })
}
