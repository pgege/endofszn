export const paths = {
  auth: {
    login: {
      path: '/login',
      getHref: (redirectTo?: string | null | undefined) =>
        `/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
    register: {
      path: '/register',
      getHref: (redirectTo?: string | null | undefined) =>
        `/register${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
  },

  app: {
    root: {
      path: '/',
      getHref: () => '/',
    },
    stores: {
      new: {
        path: '/stores/new',
        getHref: () => '/stores/new',
      },
      detail: {
        path: '/stores/:id',
        getHref: (id: string) => `/stores/${id}`,
      },
      settings: {
        path: '/stores/:id/settings',
        getHref: (id: string) => `/stores/${id}/settings`,
      },
      products: {
        list: {
          path: '/stores/:id/products',
          getHref: (id: string) => `/stores/${id}/products`,
        },
        new: {
          path: '/stores/:id/products/new',
          getHref: (id: string) => `/stores/${id}/products/new`,
        },
        detail: {
          path: '/stores/:id/products/:productId',
          getHref: (storeId: string, productId: string) => `/stores/${storeId}/products/${productId}`,
        },
      },
    },
  },
} as const
