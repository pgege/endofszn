import { Package, AlertTriangle } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { SortableHeader } from '@/components/sortable-header'
import type { InventoryItem } from '@/lib/api/inventory'

export interface DirtyFields {
  stocked_quantity?: number
  sku?: string
}

export interface InventoryEditCallbacks {
  dirtyRows: Record<string, DirtyFields>
  onFieldChange: (variantId: string, field: keyof DirtyFields, value: any) => void
  onSave: (variantId: string) => void
  onDiscard: (variantId: string) => void
}

function StockedCell({
  item,
  dirty,
  onChange,
}: {
  item: InventoryItem
  dirty?: DirtyFields
  onChange: (variantId: string, field: keyof DirtyFields, value: any) => void
}) {
  const value = dirty?.stocked_quantity ?? item.stocked_quantity
  return (
    <Input
      type="number"
      min="0"
      step="1"
      value={value}
      onChange={(e) => {
        const val = e.target.value
        const parsed = val === '' ? 0 : parseInt(val, 10)
        if (!isNaN(parsed)) onChange(item.variant_id, 'stocked_quantity', parsed)
      }}
      className="w-20 h-8"
    />
  )
}

function SkuCell({
  item,
  dirty,
  onChange,
}: {
  item: InventoryItem
  dirty?: DirtyFields
  onChange: (variantId: string, field: keyof DirtyFields, value: any) => void
}) {
  const value = dirty?.sku ?? item.sku ?? ''
  return (
    <Input
      value={value}
      onChange={(e) => onChange(item.variant_id, 'sku', e.target.value)}
      placeholder="SKU"
      className="w-28 h-8 font-mono text-sm"
    />
  )
}

export function createInventoryColumns(
  callbacks: InventoryEditCallbacks,
): ColumnDef<InventoryItem>[] {
  const { dirtyRows, onFieldChange, onSave, onDiscard } = callbacks

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 40,
      enableSorting: false,
    },
    {
      id: 'product',
      accessorKey: 'product_title',
      header: ({ column }) => <SortableHeader column={column} title="Product" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.product_thumbnail ? (
            <img src={row.original.product_thumbnail} alt="" className="h-8 w-8 object-cover" />
          ) : (
            <div className="h-8 w-8 bg-muted flex items-center justify-center">
              <Package className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
          <span className="text-sm font-medium truncate max-w-[200px]">{row.original.product_title}</span>
        </div>
      ),
    },
    {
      accessorKey: 'variant_title',
      header: 'Variant',
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm">{row.original.variant_title}</span>,
    },
    {
      id: 'sku',
      accessorKey: 'sku',
      header: ({ column }) => <SortableHeader column={column} title="SKU" />,
      cell: ({ row }) => (
        <SkuCell
          item={row.original}
          dirty={dirtyRows[row.original.variant_id]}
          onChange={onFieldChange}
        />
      ),
    },
    {
      id: 'stocked',
      accessorKey: 'stocked_quantity',
      header: ({ column }) => <SortableHeader column={column} title="In Stock" />,
      cell: ({ row }) => (
        <StockedCell
          item={row.original}
          dirty={dirtyRows[row.original.variant_id]}
          onChange={onFieldChange}
        />
      ),
    },
    {
      accessorKey: 'reserved_quantity',
      header: 'Reserved',
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm">{row.original.reserved_quantity}</span>,
    },
    {
      id: 'available',
      accessorKey: 'available_quantity',
      header: ({ column }) => <SortableHeader column={column} title="Available" />,
      cell: ({ row }) => {
        const isLow = row.original.available_quantity <= 5 && row.original.manage_inventory
        return (
          <div className="flex items-center gap-1">
            {isLow && <AlertTriangle className="h-3 w-3 text-amber-500" />}
            <span className={isLow ? 'text-amber-500 font-medium text-sm' : 'text-sm'}>
              {row.original.available_quantity}
            </span>
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      size: 120,
      enableSorting: false,
      cell: ({ row }) => {
        const isDirty = !!dirtyRows[row.original.variant_id]
        if (!isDirty || !row.original.inventory_item_id) return null
        return (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSave(row.original.variant_id)}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDiscard(row.original.variant_id)}
            >
              Discard
            </Button>
          </div>
        )
      },
    },
  ]
}
