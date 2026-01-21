import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export type User = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}

type AuthResponse = {
  user: User
}

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

export function useUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const { user } = await api.get<AuthResponse>(
        '/api/auth/me',
        undefined,
        { skipUnauthorizedCallback: true }
      )
      return user
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
      const { user } = await api.post<AuthResponse>('/api/auth/login', data)
      return user
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me(), user)
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
      const { user } = await api.post<AuthResponse>('/api/customers/register', data)
      return user
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me(), user)
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
    },
  })
}
