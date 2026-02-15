import { useSearchParams } from 'react-router-dom'
import { useCallback, useMemo, useState } from 'react'
import { RowSelectionState } from '@tanstack/react-table'
import { useStores, useDeleteStore } from '@/lib/api/auth'
import { usePersistedState } from '@/hooks/use-persisted-state'
import type { ViewMode } from '@/components/data-toolbar'
import type { Store } from '@/lib/api/auth'

function matchesSearch(store: Store, query: string): boolean {
  const q = query.toLowerCase()
  return (
    store.name.toLowerCase().includes(q) ||
    (store.profile?.description?.toLowerCase().includes(q) ?? false) ||
    (store.profile?.tagline?.toLowerCase().includes(q) ?? false)
  )
}

function sortStores(stores: Store[], order: string): Store[] {
  const desc = order.startsWith('-')
  const field = desc ? order.slice(1) : order
  const sorted = [...stores].sort((a, b) => {
    if (field === 'name') return a.name.localeCompare(b.name)
    if (field === 'created_at') {
      return (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
    }
    return 0
  })
  return desc ? sorted.reverse() : sorted
}

export function useStoreList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const statusFilter = searchParams.get('status') || ''
  const order = searchParams.get('order') || '-created_at'
  const page = parseInt(searchParams.get('page') || '1')
  const [pageSize, setPageSize] = usePersistedState('stores-page-size', 20)
  const [viewMode, setViewMode] = usePersistedState<ViewMode>('stores-view-mode', 'grid')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const { data: storesData, isLoading } = useStores()
  const allStores = storesData?.stores ?? []
  const deleteStore = useDeleteStore()

  const filtered = useMemo(() => {
    let result = allStores
    if (q) result = result.filter((s) => matchesSearch(s, q))
    if (statusFilter === 'published') result = result.filter((s) => s.profile?.isPublished)
    if (statusFilter === 'draft') result = result.filter((s) => !s.profile?.isPublished)
    return sortStores(result, order)
  }, [allStores, q, statusFilter, order])

  const totalCount = filtered.length
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))
  const stores = filtered.slice((page - 1) * pageSize, page * pageSize)

  const selectedStoreIds = useMemo(
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

  return {
    stores,
    allStores,
    totalCount,
    pageCount,
    isLoading,
    deleteStore,
    q,
    statusFilter,
    order,
    page,
    pageSize,
    setPageSize,
    viewMode,
    setViewMode,
    updateParams,
    rowSelection,
    setRowSelection,
    selectedStoreIds,
    clearSelection,
  }
}
