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
  }>
}

export interface UpdateProductInput {
  title?: string
  subtitle?: string
  description?: string
  status?: 'draft' | 'published'
  thumbnail?: string
  images?: Array<{ url: string; rank?: number }>
  category_ids?: string[]
}

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (storeId: string) => [...productKeys.lists(), storeId] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (storeId: string, productId: string) => [...productKeys.details(), storeId, productId] as const,
}

export function useProducts(storeId: string) {
  return useQuery({
    queryKey: productKeys.list(storeId),
    queryFn: async () => {
      const response = await api.get<{ products: Product[] }>(`/api/stores/${storeId}/products`)
      return response.products
    },
    enabled: !!storeId,
  })
}

export function useProduct(storeId: string, productId: string) {
  return useQuery({
    queryKey: productKeys.detail(storeId, productId),
    queryFn: async () => {
      const response = await api.get<{ product: Product }>(`/api/stores/${storeId}/products/${productId}`)
      return response.product
    },
    enabled: !!storeId && !!productId,
  })
}

export function useCreateProduct(storeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const response = await api.post<{ product: Product }>(`/api/stores/${storeId}/products`, data)
      return response.product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.list(storeId) })
    },
  })
}

export function useUpdateProduct(storeId: string, productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateProductInput) => {
      const response = await api.put<{ product: Product }>(`/api/stores/${storeId}/products/${productId}`, data)
      return response.product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.list(storeId) })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(storeId, productId) })
    },
  })
}

export function useDeleteProduct(storeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/api/stores/${storeId}/products/${productId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.list(storeId) })
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

export const variantImageKeys = {
  all: ['variantImages'] as const,
  detail: (storeId: string, productId: string, variantId: string) =>
    [...variantImageKeys.all, storeId, productId, variantId] as const,
}

export function useVariantImages(storeId: string, productId: string, variantId: string) {
  return useQuery({
    queryKey: variantImageKeys.detail(storeId, productId, variantId),
    queryFn: async () => {
      const response = await api.get<{ images: ProductImage[] }>(
        `/api/stores/${storeId}/products/${productId}/variants/${variantId}/images`
      )
      return response.images
    },
    enabled: !!storeId && !!productId && !!variantId,
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
      queryClient.invalidateQueries({ queryKey: variantImageKeys.detail(storeId, productId, variantId) })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(storeId, productId) })
    },
  })
}

export function useUpdateProductOption(storeId: string, productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ optionId, metadata }: { optionId: string; metadata: Record<string, any> }) => {
      const response = await api.put<{ option: ProductOption }>(
        `/api/stores/${storeId}/products/${productId}/options/${optionId}`,
        { metadata }
      )
      return response.option
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(storeId, productId) })
    },
  })
}
