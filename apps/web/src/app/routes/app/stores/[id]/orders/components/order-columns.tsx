import { Link } from 'react-router-dom'
import { MoreHorizontal, Eye } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { SortableHeader } from '@/components/sortable-header'
import { paths } from '@/config/paths'
import type { Order } from '@/lib/api/orders'

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  completed: 'default',
  canceled: 'destructive',
  requires_action: 'outline',
  archived: 'outline',
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'usd' }).format(amount / 100)
}

export function createOrderColumns(storeId: string): ColumnDef<Order>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
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
      id: 'display_id',
      accessorKey: 'display_id',
      header: ({ column }) => <SortableHeader column={column} title="Order" />,
      cell: ({ row }) => (
        <Link
          to={paths.app.stores.orders.detail.getHref(storeId, row.original.id)}
          className="font-mono text-sm hover:underline"
        >
          #{row.original.display_id || row.original.id.slice(-6)}
        </Link>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <SortableHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status] || 'secondary'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'customer',
      accessorKey: 'email',
      header: 'Customer',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.email || '—'}</span>
      ),
    },
    {
      id: 'total',
      accessorKey: 'total',
      header: ({ column }) => <SortableHeader column={column} title="Total" />,
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {formatCurrency(row.original.total || 0, row.original.currency_code)}
        </span>
      ),
    },
    {
      id: 'created',
      accessorKey: 'created_at',
      header: ({ column }) => <SortableHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 40,
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={paths.app.stores.orders.detail.getHref(storeId, row.original.id)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
