import { Truck, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import { DataToolbar, type BulkAction } from '@/components/data-toolbar'
import { DataPagination } from '@/components/data-pagination'
import { useShippingList } from './hooks/use-shipping-list'
import { createShippingColumns } from './components/shipping-columns'
import { useCreateShippingOption, type ShippingOption } from '@/lib/api/shipping'

export default function ShippingPage() {
  const {
    storeId, shippingOptions, totalCount, pageCount,
    isLoading, error, q, page, pageSize, setPageSize,
    viewMode, setViewMode, updateParams, deleteShipping,
    rowSelection, setRowSelection, selectedIds, clearSelection,
  } = useShippingList()

  const createMutation = useCreateShippingOption(storeId)
  const [deleteTarget, setDeleteTarget] = useState<ShippingOption | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [priceType, setPriceType] = useState<'flat_rate' | 'calculated'>('flat_rate')

  const columns = useMemo(() => createShippingColumns(setDeleteTarget), [])

  const bulkActions: BulkAction[] = useMemo(() => [
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: () => {
        selectedIds.forEach((id) => deleteShipping.mutate(id))
        clearSelection()
        toast.success(`${selectedIds.length} shipping option(s) deleted`)
      },
    },
  ], [selectedIds, deleteShipping, clearSelection])

  function handleCreate() {
    if (!newName.trim()) { toast.error('Name is required'); return }
    createMutation.mutate(
      { name: newName.trim(), price_type: priceType },
      {
        onSuccess: () => { toast.success('Shipping option created'); setShowCreate(false); setNewName('') },
        onError: (e: any) => toast.error(e.message),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading shipping options...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load shipping options</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {showCreate && (
        <form onSubmit={(e) => { e.preventDefault(); handleCreate() }} className="shrink-0 px-6 py-4 border-b bg-muted/30">
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Name</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Standard Shipping" className="h-9 w-48" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Price Type</label>
              <Select value={priceType} onValueChange={(v) => setPriceType(v as any)}>
                <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat_rate">Flat Rate</SelectItem>
                  <SelectItem value="calculated">Calculated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" size="sm" disabled={createMutation.isPending}>Create</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="shrink-0 px-6 py-3 border-b bg-background">
        <DataToolbar
          search={q}
          onSearchChange={(v) => updateParams({ q: v, page: '' })}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedCount={selectedIds.length}
          onClearSelection={clearSelection}
          bulkActions={bulkActions}
          actions={
            <Button variant="outline" size="sm" onClick={() => setShowCreate(!showCreate)}>
              <Plus className="h-4 w-4 mr-1" /> New Shipping Option
            </Button>
          }
        />
      </div>

      <div className="flex-1 overflow-hidden">
        {totalCount === 0 && !q ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No shipping options</h3>
              <p className="text-muted-foreground mb-4">Create your first shipping option to get started.</p>
              <Button variant="outline" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" /> New Shipping Option
              </Button>
            </div>
          </div>
        ) : shippingOptions.length === 0 && q ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No shipping options match your search.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={shippingOptions}
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete shipping option?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteShipping.mutate(deleteTarget.id, {
                    onSuccess: () => { toast.success('Shipping option deleted'); setDeleteTarget(null) },
                    onError: (e: any) => toast.error(e.message),
                  })
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
