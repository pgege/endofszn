import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export type Category = {
  id: string
  name: string
  description: string | null
  handle: string
  is_active: boolean
  is_internal: boolean
  rank: number
  parent_category: Category | null
  category_children: Category[]
}

type CategoriesResponse = {
  categories: Category[]
  count: number
  limit: number
  offset: number
}

export type CreateCategoryInput = {
  name: string
  description?: string
  handle?: string
  parent_category_id?: string
  is_active?: boolean
}

export type UpdateCategoryInput = {
  name?: string
  description?: string
  handle?: string
  parent_category_id?: string | null
  is_active?: boolean
}

export function useCategories(storeId: string | undefined, params?: { id?: string[]; limit?: number; offset?: number; q?: string; order?: string }) {
  return useQuery({
    queryKey: ['categories', storeId, params ?? {}],
    queryFn: async (): Promise<CategoriesResponse> => {
      if (!storeId) return { categories: [], count: 0, limit: 0, offset: 0 }
      const searchParams = new URLSearchParams()
      if (params?.id) params.id.forEach(v => searchParams.append('id', v))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.offset) searchParams.set('offset', String(params.offset))
      if (params?.q) searchParams.set('q', params.q)
      if (params?.order) searchParams.set('order', params.order)
      const qs = searchParams.toString()
      return api.get<CategoriesResponse>(`/api/stores/${storeId}/categories${qs ? `?${qs}` : ''}`)
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateCategory(storeId: string | undefined) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreateCategoryInput): Promise<Category> => {
      if (!storeId) throw new Error('Store ID required')
      const response = await api.post<{ categories: Category[] }>(`/api/stores/${storeId}/categories`, [input])
      return response.categories[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] })
    },
  })
}

export function useUpdateCategory(storeId: string | undefined) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ categoryId, ...input }: UpdateCategoryInput & { categoryId: string }): Promise<Category> => {
      if (!storeId) throw new Error('Store ID required')
      const response = await api.put<any>(`/api/stores/${storeId}/categories`, [{ id: categoryId, ...input }])
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] })
    },
  })
}

export function useDeleteCategory(storeId: string | undefined) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (categoryId: string | string[]): Promise<void> => {
      if (!storeId) throw new Error('Store ID required')
      const ids = Array.isArray(categoryId) ? categoryId : [categoryId]
      await api.delete(`/api/stores/${storeId}/categories`, { body: { ids } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] })
    },
  })
}

export type CategoryTemplate = {
  id: string
  name: string
  description: string
  structure: any[]
}

type TemplatesResponse = {
  templates: CategoryTemplate[]
  count: number
  limit: number
  offset: number
}

type UncategorizedProductsResponse = {
  uncategorized_products: Array<{
    id: string
    title: string
    handle: string
    thumbnail: string | null
  }>
  count: number
  total_products: number
}

type BulkCategorizeInput = {
  assignments: Array<{
    product_id: string
    category_ids: string[]
  }>
}

type BulkCategorizeResponse = {
  updated_products: any[]
  count: number
}

type ApplyTemplateResponse = {
  message: string
  categories: Category[]
  count: number
}

export function useCategoryTemplates(storeId: string | undefined, params?: { id?: string[]; limit?: number; offset?: number; q?: string; order?: string }) {
  return useQuery({
    queryKey: ['category-templates', storeId, params ?? {}],
    queryFn: async (): Promise<TemplatesResponse> => {
      if (!storeId) return { templates: [], count: 0, limit: 50, offset: 0 }
      const searchParams = new URLSearchParams()
      if (params?.id) params.id.forEach(v => searchParams.append('id', v))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.offset) searchParams.set('offset', String(params.offset))
      if (params?.q) searchParams.set('q', params.q)
      if (params?.order) searchParams.set('order', params.order)
      const qs = searchParams.toString()
      return await api.get<TemplatesResponse>(`/api/stores/${storeId}/categories/templates${qs ? `?${qs}` : ''}`)
    },
    enabled: !!storeId,
  })
}

export function useApplyCategoryTemplate(storeId: string | undefined) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (templateId: string): Promise<ApplyTemplateResponse> => {
      if (!storeId) throw new Error('Store ID required')
      const response = await api.post<ApplyTemplateResponse>(
        `/api/stores/${storeId}/categories/apply-template`,
        { template_id: templateId }
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] })
    },
  })
}

export function useUncategorizedProducts(storeId: string | undefined, params?: { id?: string[]; limit?: number; offset?: number; q?: string; order?: string }) {
  return useQuery({
    queryKey: ['uncategorized-products', storeId, params ?? {}],
    queryFn: async () => {
      if (!storeId) return { uncategorized_products: [], count: 0, total_products: 0 }
      const searchParams = new URLSearchParams()
      if (params?.id) params.id.forEach(v => searchParams.append('id', v))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.offset) searchParams.set('offset', String(params.offset))
      if (params?.q) searchParams.set('q', params.q)
      if (params?.order) searchParams.set('order', params.order)
      const qs = searchParams.toString()
      return api.get<UncategorizedProductsResponse>(`/api/stores/${storeId}/uncategorized-products${qs ? `?${qs}` : ''}`)
    },
    enabled: !!storeId,
  })
}

export function useBulkCategorize(storeId: string | undefined) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: BulkCategorizeInput): Promise<BulkCategorizeResponse> => {
      if (!storeId) throw new Error('Store ID required')
      const response = await api.post<BulkCategorizeResponse>(
        `/api/stores/${storeId}/bulk-categorize`,
        input
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uncategorized-products', storeId] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
