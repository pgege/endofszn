import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export interface InventoryItem {
  product_id: string
  product_title: string
  product_thumbnail: string | null
  variant_id: string
  variant_title: string
  sku: string | null
  manage_inventory: boolean
  allow_backorder: boolean
  inventory_item_id?: string
  stocked_quantity: number
  reserved_quantity: number
  available_quantity: number
}

export interface InventoryListResponse {
  inventory_items: InventoryItem[]
  count: number
  limit: number
  offset: number
}

export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (storeId: string, params?: Record<string, any>) => [...inventoryKeys.lists(), storeId, params ?? {}] as const,
}

export function useInventory(storeId: string, params?: { id?: string[]; limit?: number; offset?: number; q?: string; order?: string }) {
  return useQuery({
    queryKey: inventoryKeys.list(storeId, params),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.id) params.id.forEach(v => searchParams.append('id', v))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.offset) searchParams.set('offset', String(params.offset))
      if (params?.q) searchParams.set('q', params.q)
      if (params?.order) searchParams.set('order', params.order)
      const qs = searchParams.toString()
      return api.get<InventoryListResponse>(`/api/stores/${storeId}/inventory${qs ? `?${qs}` : ''}`)
    },
    enabled: !!storeId,
    staleTime: 1000 * 60,
  })
}

export function useUpdateInventory(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: { id: string; stocked_quantity?: number; sku?: string }[]) => {
      return api.put(`/api/stores/${storeId}/inventory`, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
    },
  })
}
