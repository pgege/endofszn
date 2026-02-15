import { useSearchParams } from 'react-router-dom'
import { useCallback, useState, useMemo } from 'react'
import { RowSelectionState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { useStoreId } from '../../store-context'
import { useInventory, useUpdateInventory } from '@/lib/api/inventory'
import { usePersistedState } from '@/hooks/use-persisted-state'
import type { ViewMode } from '@/components/data-toolbar'
import type { DirtyFields } from '../components/inventory-columns'

export function useInventoryList() {
  const storeId = useStoreId()
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') || ''
  const order = searchParams.get('order') || '-created_at'
  const page = parseInt(searchParams.get('page') || '1')
  const [pageSize, setPageSize] = usePersistedState('inventory-page-size', 50)
  const [viewMode, setViewMode] = usePersistedState<ViewMode>('inventory-view-mode', 'table')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [dirtyRows, setDirtyRows] = useState<Record<string, DirtyFields>>({})

  const offset = (page - 1) * pageSize

  const { data, isLoading, error } = useInventory(storeId, {
    limit: pageSize,
    offset,
    q: q || undefined,
    order: order || undefined,
  })

  const updateMutation = useUpdateInventory(storeId)

  const items = data?.inventory_items ?? []
  const totalCount = data?.count ?? 0
  const pageCount = Math.ceil(totalCount / pageSize)

  const selectedItems = useMemo(() => {
    const ids = Object.keys(rowSelection).filter((k) => rowSelection[k])
    return items.filter((item) => ids.includes(item.variant_id))
  }, [rowSelection, items])

  const selectedCount = selectedItems.length
  const dirtyCount = Object.keys(dirtyRows).length

  const clearSelection = useCallback(() => {
    setRowSelection({})
  }, [])

  const updateField = useCallback(
    (variantId: string, field: keyof DirtyFields, value: any) => {
      setDirtyRows((prev) => ({
        ...prev,
        [variantId]: { ...prev[variantId], [field]: value },
      }))
    },
    [],
  )

  const discardRow = useCallback(
    (variantId: string) => {
      setDirtyRows((prev) => {
        const next = { ...prev }
        delete next[variantId]
        return next
      })
    },
    [],
  )

  const saveRow = useCallback(
    (variantId: string) => {
      const item = items.find((i) => i.variant_id === variantId)
      if (!item?.inventory_item_id) return
      const dirty = dirtyRows[variantId]
      if (!dirty) return

      const update: { id: string; stocked_quantity?: number; sku?: string } = {
        id: item.inventory_item_id,
      }
      if (dirty.stocked_quantity !== undefined) update.stocked_quantity = dirty.stocked_quantity
      if (dirty.sku !== undefined) update.sku = dirty.sku

      updateMutation.mutate([update], {
        onSuccess: () => {
          toast.success('Inventory updated')
          discardRow(variantId)
        },
        onError: (e) => toast.error(e.message),
      })
    },
    [items, dirtyRows, updateMutation, discardRow],
  )

  const saveAllDirty = useCallback(() => {
    const updates = Object.entries(dirtyRows)
      .map(([variantId, dirty]) => {
        const item = items.find((i) => i.variant_id === variantId)
        if (!item?.inventory_item_id) return null
        const update: { id: string; stocked_quantity?: number; sku?: string } = {
          id: item.inventory_item_id,
        }
        if (dirty.stocked_quantity !== undefined) update.stocked_quantity = dirty.stocked_quantity
        if (dirty.sku !== undefined) update.sku = dirty.sku
        return update
      })
      .filter(Boolean) as { id: string; stocked_quantity?: number; sku?: string }[]

    if (updates.length === 0) return

    updateMutation.mutate(updates, {
      onSuccess: () => {
        toast.success(`Saved ${updates.length} item${updates.length > 1 ? 's' : ''}`)
        setDirtyRows({})
      },
      onError: (e) => toast.error(e.message),
    })
  }, [dirtyRows, items, updateMutation])

  const bulkUpdateQuantity = useCallback(
    (quantity: number) => {
      const updates = selectedItems
        .filter((item) => item.inventory_item_id)
        .map((item) => ({ id: item.inventory_item_id!, stocked_quantity: quantity }))

      if (updates.length === 0) {
        toast.error('No inventory items to update')
        return
      }

      updateMutation.mutate(updates, {
        onSuccess: () => {
          toast.success(`Updated ${updates.length} items`)
          clearSelection()
        },
        onError: (e) => toast.error(e.message),
      })
    },
    [selectedItems, updateMutation, clearSelection],
  )

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(updates)) {
          if (v) next.set(k, v)
          else next.delete(k)
        }
        return next
      })
    },
    [setSearchParams],
  )

  return {
    storeId,
    items,
    totalCount,
    pageCount,
    isLoading,
    error,
    q,
    order,
    page,
    pageSize,
    setPageSize,
    viewMode,
    setViewMode,
    updateParams,
    updateMutation,
    rowSelection,
    setRowSelection,
    selectedCount,
    clearSelection,
    bulkUpdateQuantity,
    dirtyRows,
    dirtyCount,
    updateField,
    saveRow,
    discardRow,
    saveAllDirty,
  }
}
