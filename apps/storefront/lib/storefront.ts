const MEDUSA_PROTOCOL = process.env.MEDUSA_PROTOCOL || 'http'
const MEDUSA_HOST = process.env.MEDUSA_HOST || 'localhost'
const MEDUSA_PORT = process.env.MEDUSA_PORT || '9000'
const MEDUSA_URL = `${MEDUSA_PROTOCOL}://${MEDUSA_HOST}:${MEDUSA_PORT}`
const STORE_ID = process.env.STORE_ID || ''

export class StorefrontApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message)
    this.name = 'StorefrontApiError'
  }
}

// ---------------------------------------------------------------------------
// Sub-types
// ---------------------------------------------------------------------------

/** Image attached to a product or variant */
export interface Image {
  id: string
  /** Full URL to the image */
  url: string
}

/** Price entry for a specific currency */
export interface VariantPrice {
  id: string
  /** Price in the smallest currency unit (e.g., cents for USD) */
  amount: number
  /** ISO 4217 currency code (e.g., "usd") */
  currency_code: string
}

/** A single option choice on a variant (e.g., Size=10) */
export interface VariantOption {
  id: string
  /** The selected value (e.g., "10", "Black") */
  value: string
  /** References the parent ProductOption.id */
  option_id: string
  option?: { id: string; title: string }
}

/** A purchasable variant of a product */
export interface Variant {
  id: string
  title: string
  sku: string | null
  manage_inventory: boolean
  allow_backorder: boolean
  /** The specific option selections for this variant */
  options: VariantOption[]
  /** Prices in different currencies */
  prices: VariantPrice[]
}

/** A value within a product option (e.g., "10" within Size) */
export interface ProductOptionValue {
  id: string
  /** The option value (e.g., "10", "Black") */
  value: string
  option_id: string
}

/** An option axis on a product (e.g., "Size" with values ["8", "9", "10"]) */
export interface ProductOption {
  id: string
  /** Option name (e.g., "Size", "Color") */
  title: string
  /** All available values for this option */
  values: ProductOptionValue[]
}

/** An option with per-value stock availability (computed server-side) */
export interface OptionWithAvailability {
  /** Option name (e.g., "Size", "Color") */
  name: string
  values: { value: string; inStock: boolean }[]
}

// ---------------------------------------------------------------------------
// Entity types -- complete, self-documenting
// ---------------------------------------------------------------------------

/** A product in the store. All fields are always present. */
export interface Product {
  id: string
  handle: string
  title: string
  subtitle: string | null
  description: string | null
  status: string
  thumbnail: string | null
  /** Server-computed formatted price from lowest variant (e.g., "$120.00") */
  price: string
  /** Currency of the computed price (e.g., "usd") */
  currency_code: string
  /** Product-level images. Always []. */
  images: Image[]
  /** All product variants with their prices and option selections. Always []. */
  variants: Variant[]
  /** Product option axes (e.g., Size, Color) with their available values. Always []. */
  options: ProductOption[]
  /** Categories this product belongs to. Always []. */
  categories: { id: string; name: string; handle: string }[]
  /** Arbitrary metadata stored on the product */
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  /**
   * Options with per-value stock availability.
   * Use this to render option selectors (size picker, color picker) with disabled states.
   * A value is inStock if ANY variant with that value is purchasable.
   * Always []. Empty if product has no options.
   */
  optionsWithAvailability: OptionWithAvailability[]
  /** Product highlights extracted from metadata. Always []. */
  highlights: string[]
  /** Product details text extracted from metadata. null if not set. */
  details: string | null
}

/**
 * Resolved variant returned when a user selects specific options.
 * Loaded on-demand via products.resolveVariant().
 */
export interface ResolvedVariant {
  id: string
  /** Formatted price for this specific variant (e.g., "$130.00") */
  price: string
  /** Currency code (e.g., "usd") */
  currency_code: string
  /** Whether this variant is available for purchase */
  inStock: boolean
  /** Variant-specific images, or product images as fallback. Always []. */
  images: Image[]
}

/** Store information including branding from the store profile */
export interface Store {
  id: string
  name: string
  /** Short tagline for the store */
  tagline: string | null
  /** Store description */
  description: string | null
  /** URL to store logo image */
  logo_url: string | null
  /** URL to store banner image */
  banner_url: string | null
  /** Contact email */
  contact_email: string | null
  /** Store website URL */
  website_url: string | null
  /** Supported currencies with default flag. Always []. */
  supported_currencies: { currency_code: string; is_default: boolean }[]
  created_at: string
  updated_at: string
}

/** A product collection (e.g., "Running", "Basketball") */
export interface Collection {
  id: string
  title: string
  handle: string
  description: string | null
  /** Thumbnail of the first product in the collection, or null */
  imageSrc: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

/** A product category used for navigation and filtering */
export interface Category {
  id: string
  name: string
  handle: string
  description: string | null
  /** Parent category, or null if top-level */
  parent: { id: string; name: string; handle: string } | null
  /** Direct child categories. Always []. */
  children: { id: string; name: string; handle: string }[]
}

/** Recursive tree node returned by the categories.list() endpoint */
export interface CategoryTreeNode {
  id: string
  name: string
  handle: string
  description: string | null
  children: CategoryTreeNode[]
}

/** Available option values computed from the current filtered product set */
export interface AvailableOption {
  title: string
  values: string[]
}

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface PaginationParams {
  limit?: number
  offset?: number
}

/** Parameters for listing products */
export interface ProductListParams extends PaginationParams {
  /** Full-text search across title and description */
  q?: string
  /** Sort field. Prefix with "-" for descending (e.g., "-created_at") */
  order?: string
  /** Filter by category ID(s) */
  category_id?: string | string[]
  /** Filter by collection ID(s) */
  collection_id?: string | string[]
  /** Filter by category handle (resolved server-side) */
  category_handle?: string
  /** Filter by collection handle (resolved server-side) */
  collection_handle?: string
  /** Filter by status. Defaults to ["published"] */
  status?: string | string[]
  /** Filter by variant option values (e.g., { Size: ["10"], Color: ["Black"] }) */
  options?: Record<string, string[]>
}

/** Parameters for listing collections */
export interface CollectionListParams extends PaginationParams {
  /** Full-text search across title and handle */
  q?: string
  /** Sort field. Prefix with "-" for descending */
  order?: string
}

/** Parameters for listing categories */
export interface CategoryListParams extends PaginationParams {
  /** Full-text search across name and handle */
  q?: string
}

// ---------------------------------------------------------------------------
// Paginated response
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  count: number
  limit: number
  offset: number
  [key: string]: T[] | number
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function serializeParams(params?: Record<string, unknown>): string {
  if (!params) return ''
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (key === 'options' && typeof value === 'object' && !Array.isArray(value)) {
      for (const [optName, optValues] of Object.entries(value as Record<string, string[]>)) {
        for (const v of optValues) {
          searchParams.append(`option[${optName}]`, v)
        }
      }
    } else if (Array.isArray(value)) {
      for (const v of value) {
        searchParams.append(key, String(v))
      }
    } else {
      searchParams.set(key, String(value))
    }
  }
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${MEDUSA_URL}/storefront-api/${STORE_ID}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = await res.text().catch(() => null)
    }
    throw new StorefrontApiError(res.status, `Storefront API error: ${res.status}`, body)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// SDK
// ---------------------------------------------------------------------------

export const storefront = {
  /** Store branding and configuration */
  store: {
    /** Get store info including profile data (name, branding, contact, currencies) */
    get: () => request<{ store: Store }>(''),
  },

  /** Product catalog */
  products: {
    /**
     * List products with filtering, search, sort, and pagination.
     * Returns complete product data for every product.
     *
     * @example storefront.products.list({ limit: 12 })
     * @example storefront.products.list({ collection_handle: 'running' })
     * @example storefront.products.list({ q: 'shoe', limit: 24 })
     */
    list: (params?: ProductListParams) =>
      request<{ products: Product[]; count: number; limit: number; offset: number; available_options: AvailableOption[] }>(
        `/products${serializeParams(params as Record<string, unknown>)}`
      ),

    /**
     * Get full product details by URL handle. Returns all product fields
     * plus computed detail fields: optionsWithAvailability, highlights, details.
     */
    getByHandle: (handle: string) =>
      request<{ product: Product }>(`/products/by-handle/${handle}`),

    /**
     * Resolve a specific variant by option selections. Called client-side
     * when a user selects options (size, color, etc.).
     * Returns the variant's price, stock status, and images.
     *
     * @example storefront.products.resolveVariant('air-max', { Size: '10', Color: 'Black' })
     */
    resolveVariant: (handle: string, selections: Record<string, string>) =>
      request<{ variant: ResolvedVariant }>(
        `/products/${handle}/variant${serializeParams(selections)}`
      ),
  },

  /** Product categories for navigation and filtering */
  categories: {
    /**
     * List all categories with full data (description, parent, children).
     *
     * @example storefront.categories.list()
     * @example storefront.categories.list({ q: 'shoes' })
     */
    list: (params?: CategoryListParams) =>
      request<{ tree: CategoryTreeNode[]; count: number }>(
        `/categories${serializeParams(params as Record<string, unknown>)}`
      ),

    /**
     * Get category by URL handle. Returns full category data including
     * parent and children.
     */
    getByHandle: (handle: string) =>
      request<{ category: Category }>(`/categories/by-handle/${handle}`),
  },

  /** Product collections (curated groups) */
  collections: {
    /**
     * List all collections with full data (description, imageSrc, metadata).
     *
     * @example storefront.collections.list()
     * @example storefront.collections.list({ q: 'running' })
     */
    list: (params?: CollectionListParams) =>
      request<{ collections: Collection[]; count: number; limit: number; offset: number }>(
        `/collections${serializeParams(params as Record<string, unknown>)}`
      ),

    /**
     * Get collection by URL handle. Returns full collection data.
     */
    getByHandle: (handle: string) =>
      request<{ collection: Collection }>(`/collections/by-handle/${handle}`),
  },
}
