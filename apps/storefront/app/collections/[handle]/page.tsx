import { getCollectionByHandle } from '@/features/collections/api/get-collections'
import { getProducts } from '@/features/products/api/get-products'
import { getCategories } from '@/features/categories/api/get-categories'
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

export default async function CollectionDetailPage({ params, searchParams }: Props) {
  const { handle } = await params
  const sp = await searchParams

  let collection
  try {
    const result = await getCollectionByHandle(handle)
    collection = result.collection
  } catch {
    notFound()
  }

  const q = (sp.q as string) || ''
  const order = (sp.order as string) || '-created_at'
  const categoryIds = sp.category_id
    ? Array.isArray(sp.category_id) ? sp.category_id as string[] : [sp.category_id as string]
    : []
  const page = Math.max(1, parseInt((sp.page as string) || '1', 10))
  const offset = (page - 1) * ITEMS_PER_PAGE
  const optionFilters = parseOptionParams(sp)

  const [productsResult, categoriesResult] = await Promise.allSettled([
    getProducts({
      limit: ITEMS_PER_PAGE,
      offset,
      q: q || undefined,
      order,
      collection_id: collection.id,
      category_id: categoryIds.length > 0 ? categoryIds : undefined,
      options: Object.keys(optionFilters).length > 0 ? optionFilters : undefined,
    }),
    getCategories(),
  ])

  const { products, count, available_options } = productsResult.status === 'fulfilled'
    ? productsResult.value
    : { products: [], count: 0, available_options: [] }
  const categoryTree = categoriesResult.status === 'fulfilled'
    ? categoriesResult.value.tree
    : []

  const mapped = products.map(mapProduct)

  return (
    <main className="container mx-auto px-4 py-8">
      {collection.description && (
        <p className="mb-6 text-muted-foreground">{collection.description}</p>
      )}
      <ProductFilterClient
        title={collection.title}
        products={mapped}
        count={count}
        limit={ITEMS_PER_PAGE}
        offset={offset}
        categoryTree={categoryTree}
        availableOptions={available_options}
        currentCategoryIds={categoryIds}
        currentOptions={optionFilters}
        currentOrder={order}
        currentQ={q}
        currentPage={page}
        hideCollectionFilter
      />
    </main>
  )
}
