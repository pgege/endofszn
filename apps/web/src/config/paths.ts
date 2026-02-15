export const PRODUCT_TABS = {
  basics: { id: 'basics', title: 'Basics', description: 'Name & description' },
  images: { id: 'images', title: 'Images', description: 'Product photos' },
  variants: { id: 'variants', title: 'Pricing', description: 'Variant prices' },
  options: { id: 'options', title: 'Options', description: 'Size, color, etc.' },
  info: { id: 'info', title: 'Info', description: 'Extra details' },
  preview: { id: 'preview', title: 'Preview', description: 'Customer view' },
} as const

export type ProductTab = keyof typeof PRODUCT_TABS

export const NEW_PRODUCT_STEPS = {
  basics: { id: 'basics', title: 'Basics', description: 'Name & description' },
  options: { id: 'options', title: 'Options', description: 'Size, color, etc.' },
  pricing: { id: 'pricing', title: 'Pricing', description: 'Set your prices' },
  images: { id: 'images', title: 'Images', description: 'Product photos' },
  info: { id: 'info', title: 'Info', description: 'Extra details' },
  review: { id: 'review', title: 'Review', description: 'Final check' },
} as const

export type NewProductStep = keyof typeof NEW_PRODUCT_STEPS

export const SETTINGS_SECTIONS = {
  profile: { id: 'profile', title: 'Profile', description: 'Store name and details' },
  contact: { id: 'contact', title: 'Contact', description: 'Email, phone, address' },
  social: { id: 'social', title: 'Social', description: 'Social media links' },
  policies: { id: 'policies', title: 'Policies', description: 'Shipping, returns, warranty' },
  status: { id: 'status', title: 'Status', description: 'Publish or unpublish store' },
  danger: { id: 'danger', title: 'Danger Zone', description: 'Delete store' },
} as const

export type SettingsSection = keyof typeof SETTINGS_SECTIONS

interface SearchParamDef {
  values?: readonly string[]
  description: string
}

function buildSearchParams(obj: Record<string, string | undefined>): string {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined) as [string, string][]
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries).toString()
}

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
      label: 'Dashboard',
      description: 'Home dashboard with store list',
      entity: 'app',
      params: {},
    },
    stores: {
      list: {
        path: '/stores',
        getHref: () => '/stores',
        label: 'Stores',
        description: 'All vendor stores',
        entity: 'store',
        params: {},
      },
      new: {
        path: '/stores/new',
        getHref: () => '/stores/new',
        label: 'New Store',
        description: 'Create a new store',
        entity: 'store',
        params: {},
      },
      detail: {
        path: '/stores/:id',
        getHref: (id: string) => `/stores/${id}`,
        label: 'Store Overview',
        description: 'Dashboard with store stats, quick links to products, categories, settings',
        entity: 'store',
        params: {
          id: { description: 'The Medusa store ID (e.g. store_01J...)' },
        },
      },
      settings: {
        path: '/stores/:id/settings',
        getHref: (id: string, section?: SettingsSection) =>
          `/stores/${id}/settings${buildSearchParams({ section })}`,
        label: 'Store Settings',
        description: 'Store configuration: profile, contact, social links, policies, status, danger zone',
        entity: 'store',
        params: {
          id: { description: 'The Medusa store ID' },
        },
        searchParams: {
          section: { values: Object.keys(SETTINGS_SECTIONS), description: 'Which settings section to scroll to' },
        },
      },
      products: {
        list: {
          path: '/stores/:id/products',
          getHref: (id: string) => `/stores/${id}/products`,
          label: 'Products',
          description: 'List of all products in the store',
          entity: 'product',
          params: {
            id: { description: 'The Medusa store ID' },
          },
        },
        new: {
          path: '/stores/:id/products/new',
          getHref: (id: string, step?: NewProductStep) =>
            `/stores/${id}/products/new${buildSearchParams({ step })}`,
          label: 'New Product',
          description: 'Product creation wizard with steps: basics, options, pricing, images, info, review',
          entity: 'product',
          params: {
            id: { description: 'The Medusa store ID' },
          },
          searchParams: {
            step: { values: Object.keys(NEW_PRODUCT_STEPS), description: 'Which wizard step to show' },
          },
        },
        detail: {
          path: '/stores/:id/products/:productId',
          getHref: (storeId: string, productId: string, tab?: ProductTab) =>
            `/stores/${storeId}/products/${productId}${buildSearchParams({ tab })}`,
          label: 'Product Detail',
          description: 'Full product page with tabs: basics, images, pricing, options, info, preview',
          entity: 'product',
          params: {
            id: { description: 'The Medusa store ID' },
            productId: { description: 'The Medusa product ID (e.g. prod_01J...)' },
          },
          searchParams: {
            tab: { values: Object.keys(PRODUCT_TABS), description: 'Which section of the product to view' },
          },
        },
      },
      categories: {
        list: {
          path: '/stores/:id/categories',
          getHref: (id: string, edit?: string) =>
            `/stores/${id}/categories${buildSearchParams({ edit })}`,
          label: 'Categories',
          description: 'Category tree with hierarchy management',
          entity: 'category',
          params: {
            id: { description: 'The Medusa store ID' },
          },
          searchParams: {
            edit: { description: 'Category ID to open in the edit modal on load' },
          },
        },
      },
      orders: {
        list: {
          path: '/stores/:id/orders',
          getHref: (id: string) => `/stores/${id}/orders`,
          label: 'Orders',
          description: 'Order management and fulfillment',
          entity: 'order',
          params: { id: { description: 'The Medusa store ID' } },
        },
        detail: {
          path: '/stores/:id/orders/:orderId',
          getHref: (id: string, orderId: string) => `/stores/${id}/orders/${orderId}`,
          label: 'Order Detail',
          description: 'Order details with items and fulfillment',
          entity: 'order',
          params: {
            id: { description: 'The Medusa store ID' },
            orderId: { description: 'The order ID' },
          },
        },
      },
      inventory: {
        list: {
          path: '/stores/:id/inventory',
          getHref: (id: string) => `/stores/${id}/inventory`,
          label: 'Inventory',
          description: 'Stock level management',
          entity: 'inventory',
          params: { id: { description: 'The Medusa store ID' } },
        },
      },
      customers: {
        list: {
          path: '/stores/:id/customers',
          getHref: (id: string) => `/stores/${id}/customers`,
          label: 'Customers',
          description: 'Customer management',
          entity: 'customer',
          params: { id: { description: 'The Medusa store ID' } },
        },
        detail: {
          path: '/stores/:id/customers/:customerId',
          getHref: (id: string, customerId: string) => `/stores/${id}/customers/${customerId}`,
          label: 'Customer Detail',
          description: 'Customer details with order history',
          entity: 'customer',
          params: {
            id: { description: 'The Medusa store ID' },
            customerId: { description: 'The customer ID' },
          },
        },
      },
      promotions: {
        list: {
          path: '/stores/:id/promotions',
          getHref: (id: string) => `/stores/${id}/promotions`,
          label: 'Promotions',
          description: 'Discounts and promotion management',
          entity: 'promotion',
          params: { id: { description: 'The Medusa store ID' } },
        },
      },
      collections: {
        list: {
          path: '/stores/:id/collections',
          getHref: (id: string) => `/stores/${id}/collections`,
          label: 'Collections',
          description: 'Product collection management',
          entity: 'collection',
          params: { id: { description: 'The Medusa store ID' } },
        },
      },
      shipping: {
        list: {
          path: '/stores/:id/shipping',
          getHref: (id: string) => `/stores/${id}/shipping`,
          label: 'Shipping',
          description: 'Shipping option management',
          entity: 'shipping_option',
          params: { id: { description: 'The Medusa store ID' } },
        },
      },
      priceLists: {
        list: {
          path: '/stores/:id/price-lists',
          getHref: (id: string) => `/stores/${id}/price-lists`,
          label: 'Price Lists',
          description: 'Custom pricing management',
          entity: 'price_list',
          params: { id: { description: 'The Medusa store ID' } },
        },
      },
      stockLocations: {
        list: {
          path: '/stores/:id/stock-locations',
          getHref: (id: string) => `/stores/${id}/stock-locations`,
          label: 'Stock Locations',
          description: 'Warehouse and fulfillment center management',
          entity: 'stock_location',
          params: { id: { description: 'The Medusa store ID' } },
        },
      },
    },
    workflows: {
      playground: {
        path: '/workflows/playground',
        getHref: (workflowId?: string) =>
          `/workflows/playground${buildSearchParams({ workflow: workflowId })}`,
        label: 'Workflow Playground',
        description: 'Visual workflow builder and executor',
        entity: 'workflow',
        params: {},
        searchParams: {
          workflow: { description: 'ID of a saved workflow to load' },
        },
      },
    },
  },
} as const

export interface RouteManifestEntry {
  key: string
  path: string
  label: string
  description: string
  entity: string
  params: Record<string, { description: string }>
  searchParams?: Record<string, { values?: string[]; description: string }>
}

function collectRoutes(
  obj: Record<string, any>,
  prefix: string,
  results: RouteManifestEntry[],
) {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && 'path' in value && 'label' in value) {
      const entry: RouteManifestEntry = {
        key: fullKey,
        path: value.path,
        label: value.label,
        description: value.description || '',
        entity: value.entity || '',
        params: value.params || {},
      }
      if (value.searchParams) {
        entry.searchParams = {}
        for (const [spKey, spVal] of Object.entries(value.searchParams as Record<string, SearchParamDef>)) {
          entry.searchParams[spKey] = {
            description: spVal.description,
            ...(spVal.values ? { values: [...spVal.values] } : {}),
          }
        }
      }
      results.push(entry)
    }
    if (value && typeof value === 'object' && !('path' in value)) {
      collectRoutes(value, fullKey, results)
    } else if (value && typeof value === 'object' && 'path' in value) {
      const nested = { ...value }
      delete nested.path
      delete nested.getHref
      delete nested.label
      delete nested.description
      delete nested.entity
      delete nested.params
      delete nested.searchParams
      if (Object.keys(nested).length > 0) {
        collectRoutes(nested, fullKey, results)
      }
    }
  }
}

export function getRouteManifest(): RouteManifestEntry[] {
  const results: RouteManifestEntry[] = []
  collectRoutes(paths.app, '', results)
  return results
}
