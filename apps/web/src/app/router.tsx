import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { paths } from '@/config/paths'
import { AuthGuard, GuestGuard } from '@/lib/auth'
import { AppLayout } from '@/components/layouts/app-layout'
import { AuthLayout } from '@/components/layouts/auth-layout'

const convert = (queryClient: QueryClient) => (m: any) => {
  const { clientLoader, clientAction, default: Component, ...rest } = m
  return {
    ...rest,
    loader: clientLoader?.(queryClient),
    action: clientAction?.(queryClient),
    Component,
  }
}

export const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      element: (
        <AuthGuard>
          <AppLayout />
        </AuthGuard>
      ),
      children: [
        {
          path: paths.app.root.path,
          lazy: () => import('./routes/app/dashboard').then(convert(queryClient)),
        },
        {
          path: paths.app.stores.new.path,
          lazy: () => import('./routes/app/stores/new').then(convert(queryClient)),
        },
        {
          path: paths.app.stores.detail.path,
          lazy: () => import('./routes/app/stores/[id]/index').then(convert(queryClient)),
        },
        {
          path: paths.app.stores.settings.path,
          lazy: () => import('./routes/app/stores/[id]/settings').then(convert(queryClient)),
        },
        {
          path: paths.app.stores.products.list.path,
          lazy: () => import('./routes/app/stores/[id]/products/index').then(convert(queryClient)),
        },
        {
          path: paths.app.stores.products.new.path,
          lazy: () => import('./routes/app/stores/[id]/products/new').then(convert(queryClient)),
        },
        {
          path: paths.app.stores.products.detail.path,
          lazy: () => import('./routes/app/stores/[id]/products/[productId]/index').then(convert(queryClient)),
        },
      ],
    },
    {
      element: (
        <GuestGuard>
          <AuthLayout />
        </GuestGuard>
      ),
      children: [
        {
          path: paths.auth.login.path,
          lazy: () => import('./routes/auth/login').then(convert(queryClient)),
        },
        {
          path: paths.auth.register.path,
          lazy: () => import('./routes/auth/register').then(convert(queryClient)),
        },
      ],
    },
    {
      path: '*',
      lazy: () => import('./routes/not-found').then(convert(queryClient)),
    },
  ])

export const AppRouter = () => {
  const queryClient = useQueryClient()
  const router = useMemo(() => createAppRouter(queryClient), [queryClient])
  return <RouterProvider router={router} />
}
