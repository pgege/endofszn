import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Package, Trash2, Eye, EyeOff } from 'lucide-react'
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
import { useProductList } from './hooks/use-product-list'
import { ProductCard } from './components/product-card'
import { createProductColumns } from './components/product-columns'
import type { Product } from '@/lib/api/products'

const SORT_OPTIONS = [
  { label: 'Newest', value: '-created_at' },
  { label: 'Oldest', value: 'created_at' },
  { label: 'Title A-Z', value: 'title' },
  { label: 'Title Z-A', value: '-title' },
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

export default function ProductListPage() {
  const {
    storeId, store, products, totalCount, pageCount,
    isLoading, error, storeError, deleteProduct, bulkUpdate,
    q, status, categoryId, order, page, pageSize, setPageSize,
    viewMode, setViewMode, updateParams, flatCategories, hasAnyProducts,
    rowSelection, setRowSelection, selectedProductIds, clearSelection,
  } = useProductList()

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const columns = useMemo(
    () => createProductColumns(storeId, setDeleteTarget),
    [storeId],
  )

  const sorting = useMemo(() => orderToSortingState(order), [order])

  const onSortingChange = useCallback((newSorting: SortingState) => {
    updateParams({ order: sortingStateToOrder(newSorting), page: '' })
  }, [updateParams])

  const bulkActions: BulkAction[] = useMemo(() => [
    {
      label: 'Publish',
      icon: Eye,
      onClick: () => {
        bulkUpdate.mutate(
          selectedProductIds.map((id) => ({ id, status: 'published' as const })),
          {
            onSuccess: () => { clearSelection(); toast.success(`${selectedProductIds.length} product(s) published`) },
            onError: (e) => toast.error(e.message),
          },
        )
      },
    },
    {
      label: 'Unpublish',
      icon: EyeOff,
      variant: 'outline' as const,
      onClick: () => {
        bulkUpdate.mutate(
          selectedProductIds.map((id) => ({ id, status: 'draft' as const })),
          {
            onSuccess: () => { clearSelection(); toast.success(`${selectedProductIds.length} product(s) unpublished`) },
            onError: (e) => toast.error(e.message),
          },
        )
      },
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: () => {
        deleteProduct.mutate(
          selectedProductIds,
          {
            onSuccess: () => { clearSelection(); toast.success(`${selectedProductIds.length} product(s) deleted`) },
            onError: (e) => toast.error(e.message),
          },
        )
      },
    },
  ], [selectedProductIds, bulkUpdate, deleteProduct, clearSelection])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {storeError ? 'Store not found' : 'Failed to load products'}
          </h2>
          <p className="text-muted-foreground mb-4">{error?.message || 'Something went wrong'}</p>
          <Button asChild>
            <Link to={paths.app.stores.list.getHref()}>Back to Stores</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!hasAnyProducts) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="px-6 py-8 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to={paths.app.stores.detail.getHref(storeId)}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-base font-semibold">Products</h1>
              <p className="text-muted-foreground">{store.name}</p>
            </div>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No products yet</h3>
              <p className="text-muted-foreground text-center mb-4">Create your first product to start selling</p>
              <Button asChild>
                <Link to={paths.app.stores.products.new.getHref(storeId)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={paths.app.stores.detail.getHref(storeId)}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-base font-semibold">Products</h1>
            <p className="text-muted-foreground">{store.name}</p>
          </div>
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
          statusFilter={status}
          onStatusFilterChange={(v) => updateParams({ status: v, page: '' })}
          categoryFilter={categoryId}
          onCategoryFilterChange={(v) => updateParams({ category_id: v, page: '' })}
          categories={flatCategories}
          selectedCount={selectedProductIds.length}
          onClearSelection={clearSelection}
          bulkActions={bulkActions}
          actions={
            <Button asChild>
              <Link to={paths.app.stores.products.new.getHref(storeId)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
          }
        />
      </div>

      {viewMode === 'grid' ? (
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onDelete={() => setDeleteTarget(product)}
              />
            ))}
          </div>
          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products match your filters.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <DataTable
            columns={columns}
            data={products}
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
          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products match your filters.</p>
            </div>
          )}
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
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteProduct.mutate(deleteTarget.id)
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
