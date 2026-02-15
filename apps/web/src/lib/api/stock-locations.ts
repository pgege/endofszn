import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export interface StockLocationAddress {
  address_1?: string
  city?: string
  country_code?: string
  province?: string
  postal_code?: string
}

export interface StockLocation {
  id: string
  name: string
  is_default: boolean
  address?: StockLocationAddress
  created_at: string
  updated_at: string
}

export interface StockLocationListResponse {
  stock_locations: StockLocation[]
  count: number
  limit: number
  offset: number
}

export const stockLocationKeys = {
  all: ['stock-locations'] as const,
  lists: () => [...stockLocationKeys.all, 'list'] as const,
  list: (storeId: string, params?: Record<string, any>) => [...stockLocationKeys.lists(), storeId, params ?? {}] as const,
}

export function useStockLocations(storeId: string, params?: { id?: string[]; limit?: number; offset?: number; q?: string; order?: string }) {
  return useQuery({
    queryKey: stockLocationKeys.list(storeId, params),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.id) params.id.forEach(v => searchParams.append('id', v))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.offset) searchParams.set('offset', String(params.offset))
      if (params?.q) searchParams.set('q', params.q)
      if (params?.order) searchParams.set('order', params.order)
      const qs = searchParams.toString()
      return api.get<StockLocationListResponse>(`/api/stores/${storeId}/stock-locations${qs ? `?${qs}` : ''}`)
    },
    enabled: !!storeId,
    staleTime: 1000 * 60,
  })
}

export function useCreateStockLocations(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { stock_locations: { name: string; address?: StockLocationAddress }[]; set_as_default?: boolean }) => {
      return api.post<{ stock_locations: StockLocation[] }>(`/api/stores/${storeId}/stock-locations`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockLocationKeys.lists() })
    },
  })
}

export function useUpdateStockLocations(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { stock_locations: { id: string; name?: string; address?: StockLocationAddress }[] }) => {
      return api.put<{ stock_locations: StockLocation[] }>(`/api/stores/${storeId}/stock-locations`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockLocationKeys.lists() })
    },
  })
}

export function useSetDefaultLocation(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (locationId: string) => {
      return api.put('/api/stores', [{ id: storeId, default_location_id: locationId }])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockLocationKeys.lists() })
    },
  })
}

export function useDeleteStockLocations(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      return api.delete<{ deleted: string[] }>(`/api/stores/${storeId}/stock-locations`, { body: { ids } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockLocationKeys.lists() })
    },
  })
}
