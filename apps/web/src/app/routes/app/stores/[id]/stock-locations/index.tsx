import { useState, useMemo } from 'react'
import { Plus, MapPin, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/data-table'
import { DataToolbar, type BulkAction } from '@/components/data-toolbar'
import { DataPagination } from '@/components/data-pagination'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useStockLocationList } from './hooks/use-stock-location-list'
import { createStockLocationColumns } from './components/stock-location-columns'
import { useCreateStockLocations, useSetDefaultLocation } from '@/lib/api/stock-locations'
import type { StockLocation } from '@/lib/api/stock-locations'

export default function StockLocationsPage() {
  const {
    storeId, locations, totalCount, pageCount,
    isLoading, error, q, page, pageSize, setPageSize,
    viewMode, setViewMode, updateParams, deleteMutation,
    rowSelection, setRowSelection, selectedIds, clearSelection,
  } = useStockLocationList()

  const createMutation = useCreateStockLocations(storeId)
  const setDefaultMutation = useSetDefaultLocation(storeId)
  const [deleteTarget, setDeleteTarget] = useState<StockLocation | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newCountry, setNewCountry] = useState('')

  function handleSetDefault(location: StockLocation) {
    setDefaultMutation.mutate(location.id, {
      onSuccess: () => toast.success(`${location.name} set as default`),
      onError: (e) => toast.error(e.message),
    })
  }

  const columns = useMemo(() => createStockLocationColumns(setDeleteTarget, handleSetDefault), [setDefaultMutation.isPending])

  const bulkActions: BulkAction[] = useMemo(() => [
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: () => {
        const nonDefault = selectedIds.filter((id) => {
          const loc = locations.find((l) => l.id === id)
          return loc && !loc.is_default
        })
        if (nonDefault.length === 0) {
          toast.error('Cannot delete the default location')
          return
        }
        deleteMutation.mutate(nonDefault, {
          onSuccess: () => {
            clearSelection()
            toast.success(`${nonDefault.length} location(s) deleted`)
          },
          onError: (e) => toast.error(e.message),
        })
      },
    },
  ], [selectedIds, locations, deleteMutation, clearSelection])

  function handleCreate() {
    if (!newName.trim()) { toast.error('Name is required'); return }
    createMutation.mutate(
      {
        stock_locations: [{
          name: newName.trim(),
          ...(newCity || newCountry ? {
            address: {
              ...(newCity && { city: newCity.trim() }),
              ...(newCountry && { country_code: newCountry.trim().toLowerCase() }),
            },
          } : {}),
        }],
        set_as_default: locations.length === 0,
      },
      {
        onSuccess: () => {
          toast.success('Location created')
          setShowCreate(false)
          setNewName('')
          setNewCity('')
          setNewCountry('')
        },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading locations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load locations</h2>
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
              <label className="text-xs text-muted-foreground">Location Name</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. US East Warehouse" className="h-9" />
            </div>
            <div className="w-36 space-y-1">
              <label className="text-xs text-muted-foreground">City</label>
              <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="e.g. New York" className="h-9" />
            </div>
            <div className="w-24 space-y-1">
              <label className="text-xs text-muted-foreground">Country</label>
              <Input value={newCountry} onChange={(e) => setNewCountry(e.target.value)} placeholder="e.g. US" className="h-9" maxLength={2} />
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
              <Plus className="h-4 w-4 mr-1" /> New Location
            </Button>
          }
        />
      </div>

      <div className="flex-1 overflow-hidden">
        {totalCount === 0 && !q ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No stock locations</h3>
              <p className="text-muted-foreground mb-4">Create a warehouse or fulfillment center to manage inventory.</p>
              <Button variant="outline" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" /> New Location
              </Button>
            </div>
          </div>
        ) : locations.length === 0 && q ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No locations match your search.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={locations}
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
            <AlertDialogTitle>Delete location?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the stock location. Inventory levels at this location will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate([deleteTarget.id], {
                    onSuccess: () => { toast.success('Location deleted'); setDeleteTarget(null) },
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
