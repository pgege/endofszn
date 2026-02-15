import { useSearchParams } from 'react-router-dom'
import { useCallback, useMemo, useState } from 'react'
import { RowSelectionState } from '@tanstack/react-table'
import { useStoreId } from '../../store-context'
import { useProducts, useDeleteProduct, useBulkUpdateProducts } from '@/lib/api/products'
import { useStores } from '@/lib/api/auth'
import { useCategories } from '@/lib/api/categories'
import { usePersistedState } from '@/hooks/use-persisted-state'
import type { ViewMode } from '@/components/data-toolbar'

export function useProductList() {
  const storeId = useStoreId()
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') || ''
  const status = searchParams.get('status') || ''
  const categoryId = searchParams.get('category_id') || ''
  const order = searchParams.get('order') || '-created_at'
  const page = parseInt(searchParams.get('page') || '1')
  const [pageSize, setPageSize] = usePersistedState('products-page-size', 20)
  const [viewMode, setViewMode] = usePersistedState<ViewMode>('products-view-mode', 'grid')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const offset = (page - 1) * pageSize

  const { data: storesData, isLoading: storeLoading, error: storeError } = useStores({ id: [storeId] })
  const store = storesData?.stores[0]
  const { data: productsData, isLoading: productsLoading, error: productsError } = useProducts(storeId, {
    q: q || undefined,
    status: status ? [status] : undefined,
    category_id: categoryId ? [categoryId] : undefined,
    order,
    limit: pageSize,
    offset,
  })
  const { data: categoriesData } = useCategories(storeId, { limit: 1000 })
  const categories = categoriesData?.categories ?? []
  const deleteProduct = useDeleteProduct(storeId)
  const bulkUpdate = useBulkUpdateProducts(storeId)

  const products = productsData?.products ?? []
  const totalCount = productsData?.count ?? 0
  const pageCount = Math.ceil(totalCount / pageSize)

  const selectedProductIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  )

  const clearSelection = useCallback(() => setRowSelection({}), [])

  const updateParams = useCallback((updates: Record<string, string>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [k, v] of Object.entries(updates)) {
        if (v) next.set(k, v)
        else next.delete(k)
      }
      return next
    })
  }, [setSearchParams])

  const flatCategories = useMemo(() => {
    if (!categories) return []
    const flatten = (cats: any[], depth = 0): { label: string; value: string }[] => {
      const result: { label: string; value: string }[] = []
      for (const cat of cats) {
        result.push({ label: `${'  '.repeat(depth)}${cat.name}`, value: cat.id })
        if (cat.category_children?.length) {
          result.push(...flatten(cat.category_children, depth + 1))
        }
      }
      return result
    }
    return flatten(categories)
  }, [categories])

  const hasAnyProducts = totalCount > 0 || q || status || categoryId

  return {
    storeId,
    store,
    products,
    totalCount,
    pageCount,
    isLoading: storeLoading || productsLoading,
    error: storeError || productsError,
    storeError,
    deleteProduct,
    bulkUpdate,
    q,
    status,
    categoryId,
    order,
    page,
    pageSize,
    setPageSize,
    offset,
    viewMode,
    setViewMode,
    updateParams,
    flatCategories,
    hasAnyProducts,
    rowSelection,
    setRowSelection,
    selectedProductIds,
    clearSelection,
  }
}
