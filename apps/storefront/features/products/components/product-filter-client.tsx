'use client'

import { useCallback, useState, useTransition, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { CategoryFilter02 } from '@/components/ecommerce/category-filters'
import { ProductList01 } from '@/components/ecommerce/product-lists'
import { PaginationBar } from './pagination-bar'
import { Input } from '@/components/ui/input'
import type { CategoryTreeNode, AvailableOption } from '@/lib/storefront'
import type {
  EcommerceProduct,
  EcommerceFilter,
  EcommerceFilterOption,
  EcommerceActiveFilter,
  EcommerceSortOption,
} from '@/components/ecommerce/types'

const SORT_OPTIONS = [
  { key: '-created_at', label: 'Newest' },
  { key: 'title', label: 'A-Z' },
  { key: '-title', label: 'Z-A' },
] as const

interface FilterOption {
  id: string
  label: string
}

interface ProductFilterClientProps {
  title: string
  products: EcommerceProduct[]
  count: number
  limit: number
  offset: number
  categoryTree?: CategoryTreeNode[]
  availableOptions?: AvailableOption[]
  collections?: FilterOption[]
  currentCategoryIds?: string[]
  currentCollectionIds?: string[]
  currentOptions?: Record<string, string[]>
  currentOrder?: string
  currentQ?: string
  currentPage?: number
  hideCollectionFilter?: boolean
}

function buildSearchParams(
  base: Record<string, string | string[] | undefined>,
  options?: Record<string, string[]>
): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(base)) {
    if (value === undefined || value === '') continue
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v)
    } else {
      params.set(key, value)
    }
  }
  if (options) {
    for (const [optName, optValues] of Object.entries(options)) {
      for (const v of optValues) {
        params.append(`option[${optName}]`, v)
      }
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

function collectDescendantIds(node: CategoryTreeNode): string[] {
  const ids: string[] = []
  for (const child of node.children) {
    ids.push(child.id)
    ids.push(...collectDescendantIds(child))
  }
  return ids
}

function findNodeById(nodes: CategoryTreeNode[], id: string): CategoryTreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findNodeById(node.children, id)
    if (found) return found
  }
  return undefined
}

export function ProductFilterClient({
  title,
  products,
  count,
  limit,
  offset,
  categoryTree = [],
  availableOptions = [],
  collections = [],
  currentCategoryIds = [],
  currentCollectionIds = [],
  currentOptions = {},
  currentOrder = '-created_at',
  currentQ = '',
  currentPage = 1,
  hideCollectionFilter = false,
}: ProductFilterClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(currentQ)

  const navigate = useCallback(
    (overrides: {
      q?: string
      order?: string
      category_id?: string[]
      collection_id?: string[]
      options?: Record<string, string[]>
      page?: number
    }) => {
      const q = overrides.q ?? currentQ
      const order = overrides.order ?? currentOrder
      const catIds = overrides.category_id ?? currentCategoryIds
      const colIds = overrides.collection_id ?? currentCollectionIds
      const opts = overrides.options ?? currentOptions
      const page = overrides.page ?? 1

      const params: Record<string, string | string[] | undefined> = {}
      if (q) params.q = q
      if (order && order !== '-created_at') params.order = order
      if (catIds.length > 0) params.category_id = catIds
      if (colIds.length > 0) params.collection_id = colIds
      if (page > 1) params.page = String(page)

      const cleanOpts: Record<string, string[]> = {}
      for (const [k, v] of Object.entries(opts)) {
        if (v.length > 0) cleanOpts[k] = v
      }

      startTransition(() => {
        router.push(pathname + buildSearchParams(params, cleanOpts))
      })
    },
    [pathname, currentQ, currentOrder, currentCategoryIds, currentCollectionIds, currentOptions, router]
  )

  const { filters, activeFilters, filterIdToCatIds, filterIdToOptionName } = useMemo(() => {
    const filters: EcommerceFilter[] = []
    const activeFilters: EcommerceActiveFilter[] = []
    const filterIdToCatIds = new Map<string, { nodeId: string; treeNode: CategoryTreeNode }[]>()
    const filterIdToOptionName = new Map<string, string>()

    const selectedSet = new Set(currentCategoryIds)

    function buildCategoryFilters(roots: CategoryTreeNode[]) {
      for (const root of roots) {
        if (root.children.length === 0) continue

        const filterId = `cat:${root.id}`
        const options: EcommerceFilterOption[] = []
        const catMapping: { nodeId: string; treeNode: CategoryTreeNode }[] = []

        for (const child of root.children) {
          const isChecked = selectedSet.has(child.id)
          options.push({
            value: child.id,
            label: child.name,
            checked: isChecked,
          })
          catMapping.push({ nodeId: child.id, treeNode: child })

          if (isChecked) {
            activeFilters.push({
              value: `cat:${root.id}:${child.id}`,
              label: child.name,
            })
            if (child.children.length > 0) {
              buildCategoryFilters([child])
            }
          }
        }

        filters.push({ id: filterId, name: root.name, options })
        filterIdToCatIds.set(filterId, catMapping)
      }
    }

    buildCategoryFilters(categoryTree)

    if (!hideCollectionFilter && collections.length > 0) {
      filters.push({
        id: 'collection_id',
        name: 'Collection',
        options: collections.map((c) => ({
          value: c.id,
          label: c.label,
          checked: currentCollectionIds.includes(c.id),
        })),
      })
      for (const colId of currentCollectionIds) {
        const col = collections.find((c) => c.id === colId)
        if (col) activeFilters.push({ value: `collection_id:${colId}`, label: col.label })
      }
    }

    for (const opt of availableOptions) {
      const filterId = `option:${opt.title}`
      const currentVals = currentOptions[opt.title] || []
      filters.push({
        id: filterId,
        name: opt.title,
        options: opt.values.map((v) => ({
          value: v,
          label: v,
          checked: currentVals.includes(v),
        })),
      })
      filterIdToOptionName.set(filterId, opt.title)
      for (const v of currentVals) {
        activeFilters.push({ value: `option:${opt.title}:${v}`, label: `${opt.title}: ${v}` })
      }
    }

    return { filters, activeFilters, filterIdToCatIds, filterIdToOptionName }
  }, [categoryTree, availableOptions, collections, currentCategoryIds, currentCollectionIds, currentOptions, hideCollectionFilter])

  const handleFilterChange = useCallback(
    (filterId: string, option: EcommerceFilterOption) => {
      if (filterId.startsWith('cat:')) {
        let newCatIds = [...currentCategoryIds]
        if (option.checked) {
          if (!newCatIds.includes(option.value)) newCatIds.push(option.value)
        } else {
          newCatIds = newCatIds.filter((id) => id !== option.value)
          const node = findNodeById(categoryTree, option.value)
          if (node) {
            const descIds = collectDescendantIds(node)
            newCatIds = newCatIds.filter((id) => !descIds.includes(id))
          }
        }
        navigate({ category_id: newCatIds, page: 1 })
      } else if (filterId === 'collection_id') {
        const newColIds = option.checked
          ? [...currentCollectionIds, option.value]
          : currentCollectionIds.filter((v) => v !== option.value)
        navigate({ collection_id: newColIds, page: 1 })
      } else if (filterId.startsWith('option:')) {
        const optName = filterIdToOptionName.get(filterId)
        if (!optName) return
        const currentVals = currentOptions[optName] || []
        const newVals = option.checked
          ? [...currentVals, option.value]
          : currentVals.filter((v) => v !== option.value)
        navigate({ options: { ...currentOptions, [optName]: newVals }, page: 1 })
      }
    },
    [currentCategoryIds, currentCollectionIds, currentOptions, categoryTree, filterIdToOptionName, navigate]
  )

  const handleRemoveFilter = useCallback(
    (filterValue: string) => {
      if (filterValue.startsWith('cat:')) {
        const parts = filterValue.split(':')
        const catId = parts[2]
        let newCatIds = currentCategoryIds.filter((id) => id !== catId)
        const node = findNodeById(categoryTree, catId)
        if (node) {
          const descIds = collectDescendantIds(node)
          newCatIds = newCatIds.filter((id) => !descIds.includes(id))
        }
        navigate({ category_id: newCatIds, page: 1 })
      } else if (filterValue.startsWith('collection_id:')) {
        const colId = filterValue.split(':')[1]
        navigate({ collection_id: currentCollectionIds.filter((v) => v !== colId), page: 1 })
      } else if (filterValue.startsWith('option:')) {
        const parts = filterValue.split(':')
        const optName = parts[1]
        const optValue = parts.slice(2).join(':')
        const currentVals = currentOptions[optName] || []
        navigate({ options: { ...currentOptions, [optName]: currentVals.filter((v) => v !== optValue) }, page: 1 })
      }
    },
    [currentCategoryIds, currentCollectionIds, currentOptions, categoryTree, navigate]
  )

  const handleClearAll = useCallback(() => {
    navigate({ category_id: [], collection_id: [], options: {}, page: 1 })
  }, [navigate])

  const handleSortChange = useCallback(
    (orderKey: string) => {
      navigate({ order: orderKey, page: 1 })
    },
    [navigate]
  )

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      navigate({ q: searchValue, page: 1 })
    },
    [searchValue, navigate]
  )

  const sortOptions: EcommerceSortOption[] = SORT_OPTIONS.map((opt) => ({
    name: opt.label,
    href: opt.key,
    current: currentOrder === opt.key,
  }))

  const buildPageHref = useCallback(
    (page: number) => {
      const params: Record<string, string | string[] | undefined> = {}
      if (currentQ) params.q = currentQ
      if (currentOrder && currentOrder !== '-created_at') params.order = currentOrder
      if (currentCategoryIds.length > 0) params.category_id = currentCategoryIds
      if (currentCollectionIds.length > 0) params.collection_id = currentCollectionIds
      if (page > 1) params.page = String(page)

      const cleanOpts: Record<string, string[]> = {}
      for (const [k, v] of Object.entries(currentOptions)) {
        if (v.length > 0) cleanOpts[k] = v
      }

      return pathname + buildSearchParams(params, cleanOpts)
    },
    [pathname, currentQ, currentOrder, currentCategoryIds, currentCollectionIds, currentOptions]
  )

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="mx-auto max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>
      </form>

      <CategoryFilter02
        title={title}
        filters={filters}
        sortOptions={sortOptions}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAll}
        onSortChange={handleSortChange}
      >
        <div className={isPending ? 'opacity-50 transition-opacity' : ''}>
          {products.length > 0 ? (
            <ProductList01 products={products} />
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              No products found. Try adjusting your filters.
            </div>
          )}

          <PaginationBar
            count={count}
            limit={limit}
            offset={offset}
            buildHref={buildPageHref}
          />
        </div>
      </CategoryFilter02>
    </div>
  )
}
