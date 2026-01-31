import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { paths } from '@/config/paths'
import { setOnUnauthorized } from '@/lib/api-client'
import { useVendor, authKeys, Vendor, Store } from '@/lib/api/auth'

export type { Vendor, Store }

export function useAuth() {
  const { data, isLoading } = useVendor()

  return {
    vendor: data?.vendor ?? null,
    isAuthenticated: !!data?.vendor,
    isLoading,
  }
}

export function AuthSetup({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  useEffect(() => {
    setOnUnauthorized(() => {
      queryClient.setQueryData(authKeys.me(), null)
    })
  }, [queryClient])

  return <>{children}</>
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to={paths.auth.login.getHref(location.pathname)} replace />
  }

  return <>{children}</>
}

export function GuestGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to={paths.app.root.getHref()} replace />
  }

  return <>{children}</>
}
