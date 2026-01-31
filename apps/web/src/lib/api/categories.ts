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
