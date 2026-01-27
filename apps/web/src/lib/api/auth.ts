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
  stores?: Store[]
}

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

export const storeKeys = {
  all: ['stores'] as const,
  list: () => [...storeKeys.all, 'list'] as const,
  detail: (id: string) => [...storeKeys.all, 'detail', id] as const,
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
      const { vendor } = await api.post<AuthResponse>('/api/vendors/register', data)
      return { vendor, stores: [] }
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

export function useStores() {
  return useQuery({
    queryKey: storeKeys.list(),
    queryFn: async () => {
      const { stores } = await api.get<{ stores: Store[] }>('/api/stores')
      return stores
    },
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
      const { store } = await api.post<{ store: Store }>('/api/stores', data)
      return store
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.list() })
      queryClient.invalidateQueries({ queryKey: authKeys.me() })
    },
  })
}

export function useStore(id: string) {
  return useQuery({
    queryKey: storeKeys.detail(id),
    queryFn: async () => {
      const { store } = await api.get<{ store: Store }>(`/api/stores/${id}`)
      return store
    },
    enabled: !!id,
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
      const { store } = await api.put<{ store: Store }>(`/api/stores/${id}`, data)
      return store
    },
    onSuccess: (store) => {
      queryClient.setQueryData(storeKeys.detail(id), store)
      queryClient.invalidateQueries({ queryKey: storeKeys.list() })
      queryClient.invalidateQueries({ queryKey: authKeys.me() })
    },
  })
}

export function useDeleteStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/stores/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.list() })
      queryClient.invalidateQueries({ queryKey: authKeys.me() })
    },
  })
}
