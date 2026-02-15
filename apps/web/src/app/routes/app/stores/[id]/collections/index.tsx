import { FolderOpen, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import { DataToolbar, type BulkAction } from '@/components/data-toolbar'
import { DataPagination } from '@/components/data-pagination'
import { useCollectionList } from './hooks/use-collection-list'
import { createCollectionColumns } from './components/collection-columns'
import { useCreateCollection, type Collection } from '@/lib/api/collections'

export default function CollectionsPage() {
  const {
    storeId, collections, totalCount, pageCount,
    isLoading, error, q, page, pageSize, setPageSize,
    viewMode, setViewMode, updateParams, deleteCollection,
    rowSelection, setRowSelection, selectedIds, clearSelection,
  } = useCollectionList()

  const createMutation = useCreateCollection(storeId)
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const columns = useMemo(() => createCollectionColumns(setDeleteTarget), [])

  const bulkActions: BulkAction[] = useMemo(() => [
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: () => {
        selectedIds.forEach((id) => deleteCollection.mutate(id))
        clearSelection()
        toast.success(`${selectedIds.length} collection(s) deleted`)
      },
    },
  ], [selectedIds, deleteCollection, clearSelection])

  function handleCreate() {
    if (!newTitle.trim()) { toast.error('Title is required'); return }
    createMutation.mutate(
      { title: newTitle.trim() },
      {
        onSuccess: () => { toast.success('Collection created'); setShowCreate(false); setNewTitle('') },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading collections...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load collections</h2>
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
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">Collection Title</label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Summer Collection" className="h-9" />
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
              <Plus className="h-4 w-4 mr-1" /> New Collection
            </Button>
          }
        />
      </div>

      <div className="flex-1 overflow-hidden">
        {totalCount === 0 && !q ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No collections</h3>
              <p className="text-muted-foreground mb-4">Create your first collection to organize products.</p>
              <Button variant="outline" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" /> New Collection
              </Button>
            </div>
          </div>
        ) : collections.length === 0 && q ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No collections match your search.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={collections}
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
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              Products in this collection will not be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteCollection.mutate(deleteTarget.id, {
                    onSuccess: () => { toast.success('Collection deleted'); setDeleteTarget(null) },
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
