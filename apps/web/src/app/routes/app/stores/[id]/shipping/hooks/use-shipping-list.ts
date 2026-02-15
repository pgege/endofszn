import { useSearchParams } from 'react-router-dom'
import { useCallback, useMemo, useState } from 'react'
import { RowSelectionState } from '@tanstack/react-table'
import { useStoreId } from '../../store-context'
import { useShippingOptions, useDeleteShippingOption, type ShippingListResponse } from '@/lib/api/shipping'
import { usePersistedState } from '@/hooks/use-persisted-state'
import type { ViewMode } from '@/components/data-toolbar'

export function useShippingList() {
  const storeId = useStoreId()
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') || ''
  const order = searchParams.get('order') || '-created_at'
  const page = parseInt(searchParams.get('page') || '1')
  const [pageSize, setPageSize] = usePersistedState('shipping-page-size', 20)
  const [viewMode, setViewMode] = usePersistedState<ViewMode>('shipping-view-mode', 'table')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const offset = (page - 1) * pageSize

  const { data, isLoading, error } = useShippingOptions(storeId, {
    limit: pageSize,
    offset,
    q: q || undefined,
    order: order || undefined,
  })

  const deleteShipping = useDeleteShippingOption(storeId)

  const shippingOptions = data?.shipping_options ?? []
  const totalCount = data?.count ?? 0
  const pageCount = Math.ceil(totalCount / pageSize)

  const selectedIds = useMemo(
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
    storeId, shippingOptions, totalCount, pageCount,
    isLoading, error, q, order, page, pageSize, setPageSize,
    viewMode, setViewMode, updateParams, deleteShipping,
    rowSelection, setRowSelection, selectedIds, clearSelection,
  }
}
