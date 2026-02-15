import { Percent, Plus, Trash2 } from 'lucide-react'
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
import { usePromotionList } from './hooks/use-promotion-list'
import { createPromotionColumns } from './components/promotion-columns'
import { useCreatePromotion, type Promotion } from '@/lib/api/promotions'

export default function PromotionsPage() {
  const {
    storeId, promotions, totalCount, pageCount,
    isLoading, error, q, page, pageSize, setPageSize,
    viewMode, setViewMode, updateParams, deletePromotion,
    rowSelection, setRowSelection, selectedIds, clearSelection,
  } = usePromotionList()

  const createMutation = useCreatePromotion(storeId)
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState('')

  const columns = useMemo(() => createPromotionColumns(setDeleteTarget), [])

  const bulkActions: BulkAction[] = useMemo(() => [
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: () => {
        selectedIds.forEach((id) => deletePromotion.mutate(id))
        clearSelection()
        toast.success(`${selectedIds.length} promotion(s) deleted`)
      },
    },
  ], [selectedIds, deletePromotion, clearSelection])

  function handleCreate() {
    if (!newCode.trim()) { toast.error('Code is required'); return }
    createMutation.mutate(
      {
        code: newCode.trim().toUpperCase(),
        type: 'standard',
        application_method: { type: discountType, value: parseFloat(discountValue) || 0 },
      },
      {
        onSuccess: () => { toast.success('Promotion created'); setShowCreate(false); setNewCode(''); setDiscountValue('') },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading promotions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load promotions</h2>
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
              <label className="text-xs text-muted-foreground">Code</label>
              <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="SUMMER20" className="h-9 w-40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Type</label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Value</label>
              <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder="20" className="h-9 w-24" />
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
              <Plus className="h-4 w-4 mr-1" /> New Promotion
            </Button>
          }
        />
      </div>

      <div className="flex-1 overflow-hidden">
        {totalCount === 0 && !q ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Percent className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No promotions</h3>
              <p className="text-muted-foreground mb-4">Create your first promotion to get started.</p>
              <Button variant="outline" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" /> New Promotion
              </Button>
            </div>
          </div>
        ) : promotions.length === 0 && q ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No promotions match your search.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={promotions}
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
            <AlertDialogTitle>Delete promotion?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete promotion "{deleteTarget?.code}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deletePromotion.mutate(deleteTarget.id, {
                    onSuccess: () => { toast.success('Promotion deleted'); setDeleteTarget(null) },
                    onError: (e) => toast.error(e.message),
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
