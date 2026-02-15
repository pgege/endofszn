import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export interface Collection {
  id: string
  title: string
  handle: string
  products?: Array<{ id: string; title: string; thumbnail?: string }>
  created_at: string
  updated_at: string
}

export interface CollectionListResponse {
  collections: Collection[]
  count: number
  limit: number
  offset: number
}

export const collectionKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionKeys.all, 'list'] as const,
  list: (storeId: string, params?: Record<string, any>) => [...collectionKeys.lists(), storeId, params ?? {}] as const,
  detail: (storeId: string, collectionId: string) => [...collectionKeys.all, 'detail', storeId, collectionId] as const,
}

export function useCollections(storeId: string, params?: { id?: string[]; limit?: number; offset?: number; q?: string; order?: string }) {
  return useQuery({
    queryKey: collectionKeys.list(storeId, params),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.id) params.id.forEach(v => searchParams.append('id', v))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.offset) searchParams.set('offset', String(params.offset))
      if (params?.q) searchParams.set('q', params.q)
      if (params?.order) searchParams.set('order', params.order)
      const qs = searchParams.toString()
      return api.get<CollectionListResponse>(`/api/stores/${storeId}/collections${qs ? `?${qs}` : ''}`)
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateCollection(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; handle?: string }) =>
      api.post<{ collection: Collection }>(`/api/stores/${storeId}/collections`, [data]),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: collectionKeys.lists() }) },
  })
}

export function useUpdateCollection(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ collectionId, ...data }: { collectionId: string } & Record<string, any>) =>
      api.put<any>(`/api/stores/${storeId}/collections`, [{ id: collectionId, ...data }]),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: collectionKeys.detail(storeId, vars.collectionId) })
    },
  })
}

export function useDeleteCollection(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (collectionId: string) =>
      api.delete(`/api/stores/${storeId}/collections`, { body: { ids: [collectionId] } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: collectionKeys.lists() }) },
  })
}

export function useUpdateCollectionProducts(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ collectionId, add, remove }: { collectionId: string; add?: string[]; remove?: string[] }) =>
      api.post(`/api/stores/${storeId}/collections/${collectionId}/products`, { add, remove }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.detail(storeId, vars.collectionId) })
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() })
    },
  })
}
