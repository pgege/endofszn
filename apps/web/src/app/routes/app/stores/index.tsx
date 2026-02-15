import { Link } from 'react-router-dom'
import { Plus, Store as StoreIcon, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { paths } from '@/config/paths'
import { useState, useMemo, useCallback } from 'react'
import { SortingState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import { DataToolbar, type BulkAction } from '@/components/data-toolbar'
import { DataPagination } from '@/components/data-pagination'
import { StoreCard } from '../components/store-card'
import { useStoreList } from './hooks/use-store-list'
import { createStoreColumns } from './components/store-columns'
import type { Store } from '@/lib/api/auth'

const SORT_OPTIONS = [
  { label: 'Newest', value: '-created_at' },
  { label: 'Oldest', value: 'created_at' },
  { label: 'Name A-Z', value: 'name' },
  { label: 'Name Z-A', value: '-name' },
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

export default function StoreListPage() {
  const {
    stores, totalCount, pageCount, isLoading, deleteStore,
    q, statusFilter, order, page, pageSize, setPageSize,
    viewMode, setViewMode, updateParams, allStores,
    rowSelection, setRowSelection, selectedStoreIds, clearSelection,
  } = useStoreList()

  const [deleteTarget, setDeleteTarget] = useState<Store | null>(null)

  const columns = useMemo(() => createStoreColumns(setDeleteTarget), [])

  const sorting = useMemo(() => orderToSortingState(order), [order])

  const onSortingChange = useCallback((newSorting: SortingState) => {
    updateParams({ order: sortingStateToOrder(newSorting), page: '' })
  }, [updateParams])

  const bulkActions: BulkAction[] = useMemo(() => [
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: () => {
        Promise.all(selectedStoreIds.map((id) => deleteStore.mutateAsync(id)))
          .then(() => {
            clearSelection()
            toast.success(`${selectedStoreIds.length} store(s) deleted`)
          })
          .catch((e) => toast.error(e.message))
      },
    },
  ], [selectedStoreIds, deleteStore, clearSelection])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading stores...</p>
        </div>
      </div>
    )
  }

  if (allStores.length === 0) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="px-6 py-8 space-y-6">
          <div>
            <h1 className="text-base font-semibold">Stores</h1>
            <p className="text-muted-foreground">Manage your storefronts</p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <StoreIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No stores yet</h3>
              <p className="text-muted-foreground text-center mb-4">Create your first store to start selling</p>
              <Button asChild>
                <Link to={paths.app.stores.new.getHref()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Store
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-6 pt-8 pb-4">
        <div>
          <h1 className="text-base font-semibold">Stores</h1>
          <p className="text-muted-foreground">Manage your storefronts</p>
        </div>
      </div>

      <div className="shrink-0 px-6 py-3 border-b bg-background">
        <DataToolbar
          search={q}
          onSearchChange={(v) => updateParams({ q: v, page: '' })}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortOptions={SORT_OPTIONS}
          currentSort={order}
          onSortChange={(v) => updateParams({ order: v, page: '' })}
          statusFilter={statusFilter}
          onStatusFilterChange={(v) => updateParams({ status: v, page: '' })}
          selectedCount={selectedStoreIds.length}
          onClearSelection={clearSelection}
          bulkActions={bulkActions}
          actions={
            <Button asChild>
              <Link to={paths.app.stores.new.getHref()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Store
              </Link>
            </Button>
          }
        />
      </div>

      {viewMode === 'grid' ? (
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
          {stores.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No stores match your filters.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <DataTable
            columns={columns}
            data={stores}
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
            manualSorting={false}
            getRowId={(row) => row.id}
          />
        </div>
      )}

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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete store?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}" and all its data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteStore.mutate(deleteTarget.id, {
                    onSuccess: () => toast.success(`"${deleteTarget.name}" deleted`),
                    onError: (e) => toast.error(e.message),
                  })
                  setDeleteTarget(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
