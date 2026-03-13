import { getCategoryByHandle, getCategories } from '@/features/categories/api/get-categories'
import { getProducts } from '@/features/products/api/get-products'
import { getCollections } from '@/features/collections/api/get-collections'
import { mapProduct } from '@/lib/mappers'
import { ProductFilterClient } from '@/features/products/components/product-filter-client'
import { notFound } from 'next/navigation'

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
  params: Promise<{ handle: string }>
  searchParams: Promise<Record<string, unknown>>
}

export default async function CategoryDetailPage({ params, searchParams }: Props) {
  const { handle } = await params
  const sp = await searchParams

  let category
  try {
    const result = await getCategoryByHandle(handle)
    category = result.category
  } catch {
    notFound()
  }

  const q = (sp.q as string) || ''
  const order = (sp.order as string) || '-created_at'
  const collectionIds = sp.collection_id
    ? Array.isArray(sp.collection_id) ? sp.collection_id as string[] : [sp.collection_id as string]
    : []
  const page = Math.max(1, parseInt((sp.page as string) || '1', 10))
  const offset = (page - 1) * ITEMS_PER_PAGE
  const optionFilters = parseOptionParams(sp)

  const [productsResult, categoriesResult, collectionsResult] = await Promise.allSettled([
    getProducts({
      limit: ITEMS_PER_PAGE,
      offset,
      q: q || undefined,
      order,
      category_id: category.id,
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

  return (
    <main className="container mx-auto px-4 py-8">
      {category.description && (
        <p className="mb-6 text-muted-foreground">{category.description}</p>
      )}
      <ProductFilterClient
        title={category.name}
        products={mapped}
        count={count}
        limit={ITEMS_PER_PAGE}
        offset={offset}
        categoryTree={categoryTree}
        availableOptions={available_options}
        collections={collections.map((c) => ({ id: c.id, label: c.title }))}
        currentCollectionIds={collectionIds}
        currentOptions={optionFilters}
        currentOrder={order}
        currentQ={q}
        currentPage={page}
      />
    </main>
  )
}
