import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { createBrowserRouter, RouterProvider, useRouteError } from 'react-router-dom'

import { paths } from '@/config/paths'
import { AuthGuard, GuestGuard } from '@/lib/auth'
import { AppLayout } from '@/components/layouts/app-layout'
import { AuthLayout } from '@/components/layouts/auth-layout'

function RouteErrorBoundary() {
  const error = useRouteError() as Error
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-semibold text-destructive mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">{error?.message || 'An unexpected error occurred'}</p>
      </div>
    </div>
  )
}

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
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          path: paths.app.root.path,
          lazy: () => import('./routes/app/dashboard/index').then(convert(queryClient)),
        },
        {
          path: paths.app.stores.list.path,
          lazy: () => import('./routes/app/stores/index').then(convert(queryClient)),
        },
        {
          path: paths.app.stores.new.path,
          lazy: () => import('./routes/app/stores/new').then(convert(queryClient)),
        },
        {
          path: '/stores/:id',
          lazy: async () => {
            const { StoreLayout } = await import('./routes/app/stores/[id]/store-context')
            return { Component: StoreLayout }
          },
          children: [
            {
              index: true,
              lazy: () => import('./routes/app/stores/[id]/index').then(convert(queryClient)),
            },
            {
              path: 'settings',
              lazy: () => import('./routes/app/stores/[id]/settings').then(convert(queryClient)),
            },
            {
              path: 'products',
              lazy: () => import('./routes/app/stores/[id]/products/index').then(convert(queryClient)),
            },
            {
              path: 'products/new',
              lazy: () => import('./routes/app/stores/[id]/products/new').then(convert(queryClient)),
            },
            {
              path: 'products/:productId',
              lazy: () => import('./routes/app/stores/[id]/products/[productId]/index').then(convert(queryClient)),
            },
            {
              path: 'categories',
              lazy: () => import('./routes/app/stores/[id]/categories/index').then(convert(queryClient)),
            },
            {
              path: 'orders',
              lazy: () => import('./routes/app/stores/[id]/orders/index').then(convert(queryClient)),
            },
            {
              path: 'orders/:orderId',
              lazy: () => import('./routes/app/stores/[id]/orders/[orderId]/index').then(convert(queryClient)),
            },
            {
              path: 'inventory',
              lazy: () => import('./routes/app/stores/[id]/inventory/index').then(convert(queryClient)),
            },
            {
              path: 'customers',
              lazy: () => import('./routes/app/stores/[id]/customers/index').then(convert(queryClient)),
            },
            {
              path: 'customers/:customerId',
              lazy: () => import('./routes/app/stores/[id]/customers/[customerId]/index').then(convert(queryClient)),
            },
            {
              path: 'promotions',
              lazy: () => import('./routes/app/stores/[id]/promotions/index').then(convert(queryClient)),
            },
            {
              path: 'collections',
              lazy: () => import('./routes/app/stores/[id]/collections/index').then(convert(queryClient)),
            },
            {
              path: 'shipping',
              lazy: () => import('./routes/app/stores/[id]/shipping/index').then(convert(queryClient)),
            },
            {
              path: 'price-lists',
              lazy: () => import('./routes/app/stores/[id]/price-lists/index').then(convert(queryClient)),
            },
            {
              path: 'stock-locations',
              lazy: () => import('./routes/app/stores/[id]/stock-locations/index').then(convert(queryClient)),
            },
          ],
        },
        {
          path: paths.app.workflows.playground.path,
          lazy: () => import('./routes/app/workflows/playground').then(convert(queryClient)),
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
