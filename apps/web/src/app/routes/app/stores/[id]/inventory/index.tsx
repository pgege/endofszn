import { Warehouse, X, Save } from 'lucide-react'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table'
import { DataToolbar } from '@/components/data-toolbar'
import { DataPagination } from '@/components/data-pagination'
import { useInventoryList } from './hooks/use-inventory-list'
import { createInventoryColumns } from './components/inventory-columns'

const SORT_OPTIONS = [
  { label: 'Product A-Z', value: 'product_title' },
  { label: 'Product Z-A', value: '-product_title' },
  { label: 'Stock Low-High', value: 'stocked_quantity' },
  { label: 'Stock High-Low', value: '-stocked_quantity' },
]

function BulkQuantityBar({
  selectedCount,
  onClear,
  onApply,
}: {
  selectedCount: number
  onClear: () => void
  onApply: (qty: number) => void
}) {
  const [bulkQty, setBulkQty] = useState('')

  const handleApply = () => {
    const qty = parseInt(bulkQty, 10)
    if (isNaN(qty) || qty < 0) {
      toast.error('Enter a valid quantity')
      return
    }
    onApply(qty)
    setBulkQty('')
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5">
        <X className="h-3.5 w-3.5" />
        {selectedCount} selected
      </Button>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="0"
          step="1"
          value={bulkQty}
          onChange={(e) => setBulkQty(e.target.value)}
          placeholder="Qty"
          className="w-24 h-8"
        />
        <Button variant="outline" size="sm" onClick={handleApply} disabled={!bulkQty}>
          Apply to Selected
        </Button>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const {
    items, totalCount, pageCount,
    isLoading, error, q, page, pageSize, setPageSize,
    viewMode, setViewMode, updateParams,
    rowSelection, setRowSelection, selectedCount,
    clearSelection, bulkUpdateQuantity,
    dirtyRows, dirtyCount, updateField, saveRow, discardRow, saveAllDirty,
  } = useInventoryList()

  const columns = useMemo(
    () => createInventoryColumns({ dirtyRows, onFieldChange: updateField, onSave: saveRow, onDiscard: discardRow }),
    [dirtyRows, updateField, saveRow, discardRow],
  )

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load inventory</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  if (totalCount === 0 && !q) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No inventory items</h3>
          <p className="text-muted-foreground text-sm">Add products with variants to manage inventory.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-6 py-3 border-b bg-background">
        {selectedCount > 0 ? (
          <BulkQuantityBar
            selectedCount={selectedCount}
            onClear={clearSelection}
            onApply={bulkUpdateQuantity}
          />
        ) : (
          <div className="flex items-center justify-between gap-3">
            <DataToolbar
              search={q}
              onSearchChange={(v) => updateParams({ q: v, page: '' })}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortOptions={SORT_OPTIONS}
              currentSort="-stocked_quantity"
              onSortChange={(v) => updateParams({ order: v, page: '' })}
            />
            {dirtyCount > 0 && (
              <Button variant="outline" size="sm" onClick={saveAllDirty} className="gap-1.5 shrink-0">
                <Save className="h-3.5 w-3.5" />
                Save All ({dirtyCount})
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {items.length === 0 && q ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No inventory items match your search.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            pageCount={pageCount}
            pagination={{ pageIndex: page - 1, pageSize }}
            onPaginationChange={(p) => {
              setPageSize(p.pageSize)
              updateParams({ page: String(p.pageIndex + 1) })
            }}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            manualSorting={false}
            getRowId={(row) => row.variant_id}
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
