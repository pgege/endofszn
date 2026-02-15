import { useState, useCallback } from 'react'
import { ColumnDef, RowSelectionState, PaginationState } from '@tanstack/react-table'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/data-table'
import { DataPagination } from '@/components/data-pagination'
import type { VariantInput } from './product-form-types'

const CURRENCIES = [
  { value: 'usd', label: 'USD' },
  { value: 'eur', label: 'EUR' },
  { value: 'gbp', label: 'GBP' },
  { value: 'cad', label: 'CAD' },
]

function PriceCell({
  variant,
  onUpdate,
}: {
  variant: VariantInput
  onUpdate: (id: string, field: keyof VariantInput, value: string) => void
}) {
  return (
    <Input
      type="number"
      step="0.01"
      value={variant.price}
      onChange={(e) => onUpdate(variant.id, 'price', e.target.value)}
      placeholder="0.00"
      className="w-24 h-8"
    />
  )
}

function CurrencyCell({
  variant,
  onUpdate,
}: {
  variant: VariantInput
  onUpdate: (id: string, field: keyof VariantInput, value: string) => void
}) {
  return (
    <Select
      value={variant.currency}
      onValueChange={(val) => onUpdate(variant.id, 'currency', val)}
    >
      <SelectTrigger className="w-20 h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.value} value={c.value}>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function QuantityCell({
  variant,
  onUpdate,
}: {
  variant: VariantInput
  onUpdate: (id: string, field: keyof VariantInput, value: number | undefined) => void
}) {
  return (
    <Input
      type="number"
      min="0"
      step="1"
      value={variant.quantity ?? ''}
      onChange={(e) => {
        const val = e.target.value
        onUpdate(variant.id, 'quantity', val === '' ? undefined : parseInt(val, 10))
      }}
      placeholder="0"
      className="w-20 h-8"
    />
  )
}

function BulkApplyBar({
  selectedCount,
  onClear,
  bulkPrice,
  setBulkPrice,
  bulkCurrency,
  setBulkCurrency,
  onApplyPrice,
  bulkQuantity,
  setBulkQuantity,
  onApplyQuantity,
}: {
  selectedCount: number
  onClear: () => void
  bulkPrice: string
  setBulkPrice: (v: string) => void
  bulkCurrency: string
  setBulkCurrency: (v: string) => void
  onApplyPrice: () => void
  bulkQuantity: string
  setBulkQuantity: (v: string) => void
  onApplyQuantity: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 border">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="gap-1.5"
      >
        <X className="h-3.5 w-3.5" />
        {selectedCount} selected
      </Button>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.01"
          value={bulkPrice}
          onChange={(e) => setBulkPrice(e.target.value)}
          placeholder="Price"
          className="w-24 h-8"
        />
        <Select value={bulkCurrency} onValueChange={setBulkCurrency}>
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onApplyPrice}
          disabled={!bulkPrice}
        >
          Apply Price
        </Button>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="0"
          step="1"
          value={bulkQuantity}
          onChange={(e) => setBulkQuantity(e.target.value)}
          placeholder="Qty"
          className="w-20 h-8"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onApplyQuantity}
          disabled={!bulkQuantity}
        >
          Apply Qty
        </Button>
      </div>
    </div>
  )
}

export function PricingSection({
  variants,
  setVariants,
  hasMultipleVariants,
  bulkPrice,
  setBulkPrice,
  bulkCurrency,
  setBulkCurrency,
}: {
  variants: VariantInput[]
  setVariants: React.Dispatch<React.SetStateAction<VariantInput[]>>
  hasMultipleVariants: boolean
  bulkPrice: string
  setBulkPrice: (v: string) => void
  bulkCurrency: string
  setBulkCurrency: (v: string) => void
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [bulkQuantity, setBulkQuantity] = useState('')

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k])
  const selectedCount = selectedIds.length

  const updateVariant = useCallback(
    (id: string, field: keyof VariantInput, value: any) => {
      setVariants((prev) =>
        prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
      )
    },
    [setVariants],
  )

  const applyBulkPrice = useCallback(() => {
    if (!bulkPrice) return
    const ids = new Set(selectedIds)
    setVariants((prev) =>
      prev.map((v) =>
        ids.has(v.id) ? { ...v, price: bulkPrice, currency: bulkCurrency } : v,
      ),
    )
  }, [bulkPrice, bulkCurrency, selectedIds, setVariants])

  const applyBulkQuantity = useCallback(() => {
    const qty = parseInt(bulkQuantity, 10)
    if (isNaN(qty) || qty < 0) return
    const ids = new Set(selectedIds)
    setVariants((prev) =>
      prev.map((v) => (ids.has(v.id) ? { ...v, quantity: qty } : v)),
    )
  }, [bulkQuantity, selectedIds, setVariants])

  const columns: ColumnDef<VariantInput>[] = [
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
      accessorKey: 'title',
      header: 'Variant',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground font-mono">
          {row.original.sku || '—'}
        </span>
      ),
    },
    {
      id: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <PriceCell variant={row.original} onUpdate={updateVariant} />
      ),
    },
    {
      id: 'currency',
      header: 'Currency',
      size: 100,
      cell: ({ row }) => (
        <CurrencyCell variant={row.original} onUpdate={updateVariant} />
      ),
    },
    {
      id: 'quantity',
      header: 'Qty',
      cell: ({ row }) => (
        <QuantityCell variant={row.original} onUpdate={updateVariant} />
      ),
    },
  ]

  const pageCount = Math.ceil(variants.length / pagination.pageSize)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1">Pricing & inventory</h2>
        <p className="text-muted-foreground text-sm">
          {hasMultipleVariants
            ? `You have ${variants.length} variants. Set pricing and stock for each one.`
            : 'Set your product price and stock quantity.'}
        </p>
      </div>

      {selectedCount > 0 && (
        <BulkApplyBar
          selectedCount={selectedCount}
          onClear={() => setRowSelection({})}
          bulkPrice={bulkPrice}
          setBulkPrice={setBulkPrice}
          bulkCurrency={bulkCurrency}
          setBulkCurrency={setBulkCurrency}
          onApplyPrice={applyBulkPrice}
          bulkQuantity={bulkQuantity}
          setBulkQuantity={setBulkQuantity}
          onApplyQuantity={applyBulkQuantity}
        />
      )}

      <DataTable
        columns={columns}
        data={variants}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        manualSorting={false}
        manualPagination={false}
        getRowId={(row) => row.id}
      />

      {variants.length > pagination.pageSize && (
        <DataPagination
          page={pagination.pageIndex + 1}
          pageCount={pageCount}
          pageSize={pagination.pageSize}
          totalCount={variants.length}
          onPageChange={(p) =>
            setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))
          }
          onPageSizeChange={(s) => setPagination({ pageIndex: 0, pageSize: s })}
        />
      )}
    </div>
  )
}
