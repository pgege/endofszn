import { ShoppingCart, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useMemo, useCallback } from 'react'
import { SortingState } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table'
import { DataToolbar } from '@/components/data-toolbar'
import { DataPagination } from '@/components/data-pagination'
import { useOrderList } from './hooks/use-order-list'
import { createOrderColumns } from './components/order-columns'

const SORT_OPTIONS = [
  { label: 'Newest', value: '-created_at' },
  { label: 'Oldest', value: 'created_at' },
]

const STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Canceled', value: 'canceled' },
]

function orderToSortingState(order: string): SortingState {
  const desc = order.startsWith('-')
  const field = desc ? order.slice(1) : order
  const id = field === 'created_at' ? 'created' : field
  return [{ id, desc }]
}

function sortingStateToOrder(sorting: SortingState): string {
  if (sorting.length === 0) return '-created_at'
  const { id, desc } = sorting[0]
  const field = id === 'created' ? 'created_at' : id
  return desc ? `-${field}` : field
}

export default function OrdersPage() {
  const {
    storeId, orders, totalCount, pageCount,
    isLoading, error, q, status, order, page, pageSize, setPageSize,
    viewMode, setViewMode, updateParams, rowSelection, setRowSelection,
    selectedOrderIds, clearSelection,
  } = useOrderList()

  const columns = useMemo(() => createOrderColumns(storeId), [storeId])
  const sorting = useMemo(() => orderToSortingState(order), [order])

  const onSortingChange = useCallback((newSorting: SortingState) => {
    updateParams({ order: sortingStateToOrder(newSorting), page: '' })
  }, [updateParams])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load orders</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  if (totalCount === 0 && !q && !status) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No orders yet</h3>
          <p className="text-muted-foreground text-sm">Orders will appear here when customers purchase from your store.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-6 py-3 border-b bg-background">
        <DataToolbar
          search={q}
          onSearchChange={(v) => updateParams({ q: v, page: '' })}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortOptions={SORT_OPTIONS}
          currentSort={order}
          onSortChange={(v) => updateParams({ order: v, page: '' })}
          statusFilter={status}
          onStatusFilterChange={(v) => updateParams({ status: v, page: '' })}
          selectedCount={selectedOrderIds.length}
          onClearSelection={clearSelection}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <DataTable
          columns={columns}
          data={orders}
          pageCount={pageCount}
          pagination={{ pageIndex: page - 1, pageSize }}
          onPaginationChange={(p) => {
            setPageSize(p.pageSize)
            updateParams({ page: String(p.pageIndex + 1) })
          }}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          sorting={sorting}
          onSortingChange={onSortingChange}
          manualSorting
          getRowId={(row) => row.id}
        />
      </div>

      <div className="shrink-0 px-6 py-3 border-t bg-background">
        <DataPagination
          page={page}
          pageCount={pageCount}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={(p) => updateParams({ page: String(p) })}
          onPageSizeChange={(s) => { setPageSize(s); updateParams({ page: '1' }) }}
        />
      </div>
    </div>
  )
}
