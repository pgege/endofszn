import { getProducts } from '@/features/products/api/get-products'
import { getCategories } from '@/features/categories/api/get-categories'
import { getCollections } from '@/features/collections/api/get-collections'
import { mapProduct } from '@/lib/mappers'
import { ProductFilterClient } from '@/features/products/components/product-filter-client'

const ITEMS_PER_PAGE = 24

function parseOptionParams(raw: Record<string, unknown>): Record<string, string[]> {
  const options: Record<string, string[]> = {}
  for (const key of Object.keys(raw)) {
    if (!key.startsWith('option[') || !key.endsWith(']')) continue
    const optName = key.slice(7, -1)
    if (!optName) continue
    const val = raw[key]
    options[optName] = Array.isArray(val) ? val as string[] : [val as string]
  }
  return options
}

interface Props {
  searchParams: Promise<Record<string, unknown>>
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams

  const q = (params.q as string) || ''
  const order = (params.order as string) || '-created_at'
  const categoryIds = params.category_id
    ? Array.isArray(params.category_id) ? params.category_id as string[] : [params.category_id as string]
    : []
  const collectionIds = params.collection_id
    ? Array.isArray(params.collection_id) ? params.collection_id as string[] : [params.collection_id as string]
    : []
  const page = Math.max(1, parseInt((params.page as string) || '1', 10))
  const offset = (page - 1) * ITEMS_PER_PAGE
  const optionFilters = parseOptionParams(params)

  const [productsResult, categoriesResult, collectionsResult] = await Promise.allSettled([
    getProducts({
      limit: ITEMS_PER_PAGE,
      offset,
      q: q || undefined,
      order,
      category_id: categoryIds.length > 0 ? categoryIds : undefined,
      collection_id: collectionIds.length > 0 ? collectionIds : undefined,
      options: Object.keys(optionFilters).length > 0 ? optionFilters : undefined,
    }),
    getCategories(),
    getCollections({ limit: 100 }),
  ])

  const { products, count, available_options } = productsResult.status === 'fulfilled'
    ? productsResult.value
    : { products: [], count: 0, available_options: [] }
  const categoryTree = categoriesResult.status === 'fulfilled'
    ? categoriesResult.value.tree
    : []
  const collections = collectionsResult.status === 'fulfilled'
    ? collectionsResult.value.collections
    : []

  const mapped = products.map(mapProduct)
  const pageTitle = q ? `Results for "${q}"` : 'All Products'

  return (
    <main className="container mx-auto px-4 py-8">
      <ProductFilterClient
        title={pageTitle}
        products={mapped}
        count={count}
        limit={ITEMS_PER_PAGE}
        offset={offset}
        categoryTree={categoryTree}
        availableOptions={available_options}
        collections={collections.map((c) => ({ id: c.id, label: c.title }))}
        currentCategoryIds={categoryIds}
        currentCollectionIds={collectionIds}
        currentOptions={optionFilters}
        currentOrder={order}
        currentQ={q}
        currentPage={page}
      />
    </main>
  )
}
