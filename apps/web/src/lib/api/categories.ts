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
}

type CategoryResponse = {
  category: Category
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

export function useCategories(storeId: string | undefined) {
  return useQuery({
    queryKey: ['categories', storeId],
    queryFn: async (): Promise<Category[]> => {
      if (!storeId) return []
      const response = await api.get<CategoriesResponse>(`/api/stores/${storeId}/categories`)
      return response.categories
    },
    enabled: !!storeId,
  })
}

export function useCategory(storeId: string | undefined, categoryId: string | undefined) {
  return useQuery({
    queryKey: ['category', storeId, categoryId],
    queryFn: async (): Promise<Category | null> => {
      if (!storeId || !categoryId) return null
      const response = await api.get<CategoryResponse>(`/api/stores/${storeId}/categories/${categoryId}`)
      return response.category
    },
    enabled: !!storeId && !!categoryId,
  })
}

export function useCreateCategory(storeId: string | undefined) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreateCategoryInput): Promise<Category> => {
      if (!storeId) throw new Error('Store ID required')
      const response = await api.post<CategoryResponse>(`/api/stores/${storeId}/categories`, input)
      return response.category
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
      const response = await api.put<CategoryResponse>(`/api/stores/${storeId}/categories/${categoryId}`, input)
      return response.category
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] })
      queryClient.invalidateQueries({ queryKey: ['category', storeId, variables.categoryId] })
    },
  })
}

export function useDeleteCategory(storeId: string | undefined) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (categoryId: string): Promise<void> => {
      if (!storeId) throw new Error('Store ID required')
      await api.delete(`/api/stores/${storeId}/categories/${categoryId}`)
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

export function useCategoryTemplates(storeId: string | undefined) {
  return useQuery({
    queryKey: ['category-templates', storeId],
    queryFn: async (): Promise<CategoryTemplate[]> => {
      if (!storeId) return []
      const response = await api.get<TemplatesResponse>(`/api/stores/${storeId}/categories/templates`)
      return response.templates
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

export function useUncategorizedProducts(storeId: string | undefined) {
  return useQuery({
    queryKey: ['uncategorized-products', storeId],
    queryFn: async () => {
      if (!storeId) return { uncategorized_products: [], count: 0, total_products: 0 }
      return api.get<UncategorizedProductsResponse>(`/api/stores/${storeId}/uncategorized-products`)
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
      queryClient.invalidateQueries({ queryKey: ['products', storeId] })
    },
  })
}
