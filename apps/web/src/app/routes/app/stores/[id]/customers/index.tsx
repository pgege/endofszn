import { Users } from 'lucide-react'
import { useMemo, useCallback } from 'react'
import { SortingState } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table'
import { DataToolbar } from '@/components/data-toolbar'
import { DataPagination } from '@/components/data-pagination'
import { useCustomerList } from './hooks/use-customer-list'
import { createCustomerColumns } from './components/customer-columns'

const SORT_OPTIONS = [
  { label: 'Newest', value: '-created_at' },
  { label: 'Oldest', value: 'created_at' },
  { label: 'Email A-Z', value: 'email' },
  { label: 'Email Z-A', value: '-email' },
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

export default function CustomersPage() {
  const {
    storeId, customers, totalCount, pageCount,
    isLoading, error, q, page, pageSize, setPageSize,
    viewMode, setViewMode, updateParams, rowSelection, setRowSelection,
    selectedCustomerIds, clearSelection,
  } = useCustomerList()

  const columns = useMemo(() => createCustomerColumns(storeId), [storeId])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load customers</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  if (totalCount === 0 && !q) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No customers yet</h3>
          <p className="text-muted-foreground text-sm">Customers will appear here when they create accounts or place orders.</p>
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
          currentSort="-created_at"
          onSortChange={(v) => updateParams({ order: v, page: '' })}
          selectedCount={selectedCustomerIds.length}
          onClearSelection={clearSelection}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        {customers.length === 0 && q ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No customers match your search.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={customers}
            pageCount={pageCount}
            pagination={{ pageIndex: page - 1, pageSize }}
            onPaginationChange={(p) => {
              setPageSize(p.pageSize)
              updateParams({ page: String(p.pageIndex + 1) })
            }}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            manualSorting={false}
            getRowId={(row) => row.id}
          />
        )}
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
