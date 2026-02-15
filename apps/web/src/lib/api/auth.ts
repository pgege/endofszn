import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export type Vendor = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}

export type StoreProfile = {
  id: string
  storeId: string
  description: string | null
  tagline: string | null
  logoUrl: string | null
  bannerUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  address: {
    street: string | null
    city: string | null
    state: string | null
    country: string | null
    postalCode: string | null
  }
  socialLinks: {
    website: string | null
    instagram: string | null
    twitter: string | null
    facebook: string | null
    tiktok: string | null
  }
  businessInfo: {
    businessType: string | null
    taxId: string | null
    registrationNumber: string | null
  }
  shippingPolicy: string | null
  returnsPolicy: string | null
  warrantyPolicy: string | null
  isPublished: boolean
  acceptsOrders: boolean
}

export type Store = {
  id: string
  name: string
  createdAt?: string
  profile: StoreProfile | null
}

type AuthResponse = {
  vendor: Vendor
}

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

export type StoreListParams = {
  id?: string[]
  limit?: number
  offset?: number
  q?: string
  order?: string
}

export const storeKeys = {
  all: ['stores'] as const,
  list: (params?: StoreListParams) => [...storeKeys.all, 'list', params ?? {}] as const,
}

export function useVendor() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const response = await api.get<AuthResponse>(
        '/api/auth/me',
        undefined,
        { skipUnauthorizedCallback: true }
      )
      return response
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await api.post<AuthResponse>('/api/auth/login', data)
      return response
    },
    onSuccess: (response) => {
      queryClient.setQueryData(authKeys.me(), response)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      email: string
      password: string
      firstName: string
      lastName: string
    }) => {
      const response = await api.post<AuthResponse>('/api/vendors/register', data)
      return response
    },
    onSuccess: (response) => {
      queryClient.setQueryData(authKeys.me(), response)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/logout')
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me(), null)
      queryClient.removeQueries({ queryKey: storeKeys.all })
    },
  })
}

export type StoreListResponse = {
  stores: Store[]
  count: number
  limit: number
  offset: number
}

export function useStores(params?: StoreListParams) {
  return useQuery({
    queryKey: storeKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.id) params.id.forEach(id => searchParams.append('id', id))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.offset) searchParams.set('offset', String(params.offset))
      if (params?.q) searchParams.set('q', params.q)
      if (params?.order) searchParams.set('order', params.order)
      const qs = searchParams.toString()
      return api.get<StoreListResponse>(`/api/stores${qs ? `?${qs}` : ''}`)
    },
    staleTime: 1000 * 60 * 2,
  })
}

export type CreateStoreInput = {
  name: string
  description?: string
  tagline?: string
  logo_url?: string
  banner_url?: string
  contact_email?: string
  contact_phone?: string
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    postal_code?: string
  }
  social_links?: {
    website?: string
    instagram?: string
    twitter?: string
    facebook?: string
    tiktok?: string
  }
  business_info?: {
    business_type?: string
    tax_id?: string
    registration_number?: string
  }
  default_currency_code?: string
}

export function useCreateStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateStoreInput) => {
      const response = await api.post<{ stores: Store[] }>('/api/stores', [data])
      return response.stores[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all })
    },
  })
}

export type UpdateStoreInput = {
  name?: string
  description?: string
  tagline?: string
  logo_url?: string | null
  banner_url?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  address_street?: string | null
  address_city?: string | null
  address_state?: string | null
  address_country?: string | null
  address_postal_code?: string | null
  website_url?: string | null
  instagram_url?: string | null
  twitter_url?: string | null
  facebook_url?: string | null
  tiktok_url?: string | null
  business_type?: string | null
  tax_id?: string | null
  registration_number?: string | null
  is_published?: boolean
  accepts_orders?: boolean
}

export function useUpdateStore(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateStoreInput) => {
      const response = await api.put<{ stores: Store[] }>('/api/stores', [{ id, ...data }])
      return response.stores[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all })
    },
  })
}

export function useDeleteStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string | string[]) => {
      const ids = Array.isArray(id) ? id : [id]
      await api.delete('/api/stores', { body: { ids } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all })
    },
  })
}
