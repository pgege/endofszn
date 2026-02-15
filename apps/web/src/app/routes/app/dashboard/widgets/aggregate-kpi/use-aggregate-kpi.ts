import { useStores } from '@/lib/api/auth'
import { useQueries } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { ProductListResponse } from '@/lib/api/products'
import { productKeys } from '@/lib/api/products'

export function useAggregateKpi() {
  const { data: storesData, isLoading: storesLoading } = useStores()
  const stores = storesData?.stores ?? []

  const productQueries = useQueries({
    queries: stores.map((store) => ({
      queryKey: productKeys.list(store.id, { limit: 0 }),
      queryFn: async () => {
        const response = await api.get<ProductListResponse>(
          `/api/stores/${store.id}/products?limit=1&offset=0`
        )
        return response
      },
      enabled: !!store.id,
      staleTime: 1000 * 60 * 2,
    })),
  })

  const publishedQueries = useQueries({
    queries: stores.map((store) => ({
      queryKey: [...productKeys.list(store.id, { status: 'published', limit: 0 }), 'published-count'],
      queryFn: async () => {
        const response = await api.get<ProductListResponse>(
          `/api/stores/${store.id}/products?status=published&limit=1&offset=0`
        )
        return response
      },
      enabled: !!store.id,
      staleTime: 1000 * 60 * 2,
    })),
  })

  const isLoading = storesLoading || productQueries.some((q) => q.isLoading) || publishedQueries.some((q) => q.isLoading)

  const totalStores = stores.length
  const totalProducts = productQueries.reduce((sum, q) => sum + (q.data?.count ?? 0), 0)
  const publishedProducts = publishedQueries.reduce((sum, q) => sum + (q.data?.count ?? 0), 0)
  const draftProducts = totalProducts - publishedProducts

  return { totalStores, totalProducts, publishedProducts, draftProducts, isLoading }
}
