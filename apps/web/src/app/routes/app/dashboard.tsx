import { Link } from 'react-router-dom'
import { Plus, Store as StoreIcon, Loader2, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { paths } from '@/config/paths'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataToolbar, type BulkAction } from '@/components/data-toolbar'
import { DataTable } from '@/components/data-table'
import { DataPagination } from '@/components/data-pagination'
import { useStoreList } from './hooks/use-store-list'
import { StoreCard } from './components/store-card'
import { storeColumns } from './components/store-columns'
import { useState, useMemo, useCallback } from 'react'
import { RowSelectionState, SortingState } from '@tanstack/react-table'
import { useDeleteStore } from '@/lib/api/auth'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { vendor } = useAuth()
  const {
    stores, allStores, totalCount, pageCount,
    page, setPage, pageSize, setPageSize,
    isLoading, error, viewMode, setViewMode, search, setSearch,
  } = useStoreList()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const deleteStore = useDeleteStore()

  const selectedStoreIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  )

  const clearSelection = useCallback(() => setRowSelection({}), [])

  const bulkActions: BulkAction[] = useMemo(() => [
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: () => {
        const count = selectedStoreIds.length
        Promise.allSettled(selectedStoreIds.map((id) => deleteStore.mutateAsync(id)))
          .then(() => { clearSelection(); toast.success(`${count} store(s) deleted`) })
          .catch((e) => toast.error(e.message))
      },
    },
  ], [selectedStoreIds, deleteStore, clearSelection])

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load stores</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (allStores.length === 0) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="px-6 py-8 space-y-6">
          <div>
            <h1 className="text-base font-semibold">Welcome back, {vendor?.firstName || 'there'}!</h1>
            <p className="text-muted-foreground mt-1">Manage your stores and products</p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <StoreIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No stores yet</h3>
              <p className="text-muted-foreground text-center mb-4">Create your first store to start selling products</p>
              <Button asChild>
                <Link to={paths.app.stores.new.getHref()}>
                  <Plus className="h-4 w-4 mr-2" />Create Store
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
        <h1 className="text-base font-semibold">Welcome back, {vendor?.firstName || 'there'}!</h1>
        <p className="text-muted-foreground mt-1">Manage your stores and products</p>
      </div>

      <div className="shrink-0 px-6 py-3 border-b bg-background">
        <DataToolbar
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1) }}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedCount={selectedStoreIds.length}
          onClearSelection={clearSelection}
          bulkActions={bulkActions}
          actions={
            <Button asChild>
              <Link to={paths.app.stores.new.getHref()}>
                <Plus className="h-4 w-4 mr-2" />New Store
              </Link>
            </Button>
          }
        />
      </div>

      {viewMode === 'grid' ? (
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => <StoreCard key={store.id} store={store} />)}
            <Card className="border-dashed hover:border-primary/50 transition-colors">
              <Link to={paths.app.stores.new.getHref()} className="flex flex-col items-center justify-center h-full min-h-[200px] p-6">
                <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-muted-foreground font-medium">Add Store</span>
              </Link>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <DataTable
            columns={storeColumns}
            data={stores}
            pageCount={pageCount}
            pagination={{ pageIndex: page - 1, pageSize }}
            onPaginationChange={(p) => { setPageSize(p.pageSize); setPage(p.pageIndex + 1) }}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            sorting={sorting}
            onSortingChange={setSorting}
            manualSorting={false}
            getRowId={(row) => row.id}
          />
        </div>
      )}

      <div className="shrink-0 px-6 py-3 border-t bg-background">
        <DataPagination
          page={page} pageCount={pageCount} pageSize={pageSize} totalCount={totalCount}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        />
      </div>
    </div>
  )
}
