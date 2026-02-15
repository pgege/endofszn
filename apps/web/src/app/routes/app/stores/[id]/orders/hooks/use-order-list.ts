import { useSearchParams } from 'react-router-dom'
import { useCallback, useMemo, useState } from 'react'
import { RowSelectionState } from '@tanstack/react-table'
import { useStoreId } from '../../store-context'
import { useOrders } from '@/lib/api/orders'
import { usePersistedState } from '@/hooks/use-persisted-state'
import type { ViewMode } from '@/components/data-toolbar'

export function useOrderList() {
  const storeId = useStoreId()
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') || ''
  const status = searchParams.get('status') || ''
  const order = searchParams.get('order') || '-created_at'
  const page = parseInt(searchParams.get('page') || '1')
  const [pageSize, setPageSize] = usePersistedState('orders-page-size', 20)
  const [viewMode, setViewMode] = usePersistedState<ViewMode>('orders-view-mode', 'table')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const offset = (page - 1) * pageSize

  const { data, isLoading, error } = useOrders(storeId, {
    limit: pageSize,
    offset,
    q: q || undefined,
    order: order || undefined,
    status: status ? [status] : undefined,
  })

  const orders = data?.orders ?? []
  const totalCount = data?.count ?? 0
  const pageCount = Math.ceil(totalCount / pageSize)

  const selectedOrderIds = useMemo(
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
    storeId,
    orders,
    totalCount,
    pageCount,
    isLoading,
    error,
    q,
    status,
    order,
    page,
    pageSize,
    setPageSize,
    viewMode,
    setViewMode,
    updateParams,
    rowSelection,
    setRowSelection,
    selectedOrderIds,
    clearSelection,
  }
}
