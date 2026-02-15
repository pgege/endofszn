import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export interface ProductImage {
  id: string
  url: string
  rank?: number
}

export interface ProductOptionValue {
  id: string
  value: string
}

export interface OptionValueMetadata {
  colorHex?: string
  imageUrl?: string
}

export interface OptionMetadata {
  values: Record<string, OptionValueMetadata>
}

export interface ProductOption {
  id: string
  title: string
  values?: ProductOptionValue[]
  metadata?: OptionMetadata
}

export interface ProductVariant {
  id: string
  title: string
  sku?: string | null
  barcode?: string | null
  prices?: Array<{
    id: string
    amount: number
    currency_code: string
  }>
  options?: Record<string, string>
  images?: ProductImage[]
  manage_inventory?: boolean
  allow_backorder?: boolean
}

export interface ProductSection {
  name: string
  content: string
}

export interface Product {
  id: string
  title: string
  handle: string
  subtitle?: string | null
  description?: string | null
  status: 'draft' | 'published' | 'rejected' | 'proposed'
  thumbnail?: string | null
  images?: ProductImage[]
  options?: ProductOption[]
  variants?: ProductVariant[]
  metadata?: {
    sections?: ProductSection[]
  }
  created_at: string
  updated_at: string
}

export interface CreateProductInput {
  title: string
  subtitle?: string
  description?: string
  status?: 'draft' | 'published'
  thumbnail?: string
  images?: Array<{ url: string; rank?: number }>
  category_ids?: string[]
  options?: Array<{ 
    title: string
    values: string[]
    metadata?: OptionMetadata
  }>
  variants?: Array<{
    title: string
    sku?: string
    barcode?: string
    prices?: Array<{ amount: number; currency_code: string }>
    options?: Record<string, string>
    manage_inventory?: boolean
    allow_backorder?: boolean
    quantity?: number
  }>
  metadata?: {
    sections?: ProductSection[]
  }
}

export interface UpdateProductInput {
  title?: string
  subtitle?: string
  description?: string
  status?: 'draft' | 'published'
  thumbnail?: string
  images?: Array<{ url: string; rank?: number }>
  category_ids?: string[]
  metadata?: {
    sections?: ProductSection[]
  }
  variants?: Array<{
    id?: string
    title?: string
    sku?: string
    prices?: Array<{ amount: number; currency_code: string }>
    options?: Record<string, string>
    manage_inventory?: boolean
    allow_backorder?: boolean
    quantity?: number
  }>
}

export interface ProductListParams {
  id?: string[]
  q?: string
  status?: string[]
  category_id?: string[]
  order?: string
  limit?: number
  offset?: number
}

export interface ProductListResponse {
  products: Product[]
  count: number
  limit: number
  offset: number
}

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (storeId: string, params?: ProductListParams) => [...productKeys.lists(), storeId, params ?? {}] as const,
}

export function useProducts(storeId: string, params?: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(storeId, params),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.id) params.id.forEach(id => searchParams.append('id', id))
      if (params?.q) searchParams.set('q', params.q)
      if (params?.status) params.status.forEach(v => searchParams.append('status', v))
      if (params?.category_id) params.category_id.forEach(v => searchParams.append('category_id', v))
      if (params?.order) searchParams.set('order', params.order)
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.offset) searchParams.set('offset', String(params.offset))
      const qs = searchParams.toString()
      const response = await api.get<ProductListResponse>(
        `/api/stores/${storeId}/products${qs ? `?${qs}` : ''}`
      )
      return response
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateProduct(storeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const response = await api.post<{ products: Product[] }>(`/api/stores/${storeId}/products`, [data])
      return response.products[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

export function useUpdateProduct(storeId: string, productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateProductInput) => {
      const response = await api.put<any>(`/api/stores/${storeId}/products`, [{ id: productId, ...data }])
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

export function useDeleteProduct(storeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string | string[]) => {
      const ids = Array.isArray(productId) ? productId : [productId]
      await api.delete(`/api/stores/${storeId}/products`, { body: { ids } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

export function useBulkUpdateProducts(storeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Array<{ id: string } & Partial<UpdateProductInput>>) => {
      return api.put<any>(`/api/stores/${storeId}/products`, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

export async function uploadFiles(files: File[]): Promise<Array<{ id: string; url: string }>> {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  const response = await fetch('/api/uploads', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  const text = await response.text()
  
  if (!response.ok) {
    let message = 'Upload failed'
    try {
      const error = JSON.parse(text)
      message = error.message || message
    } catch {
      message = text || message
    }
    throw new Error(message)
  }

  const data = JSON.parse(text)
  return data.files
}

export function useUploadFiles() {
  return useMutation({
    mutationFn: uploadFiles,
  })
}

export function useUpdateVariantImages(storeId: string, productId: string, variantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { add?: string[]; remove?: string[] }) => {
      const response = await api.post<{ images: ProductImage[] }>(
        `/api/stores/${storeId}/products/${productId}/variants/${variantId}/images`,
        data
      )
      return response.images
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

export function useUpdateProductOption(storeId: string, productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ optionId, title, values }: { optionId: string; title?: string; values?: string[] }) => {
      const response = await api.put<any>(
        `/api/stores/${storeId}/products/${productId}/options`,
        [{ id: optionId, title, values }]
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}
