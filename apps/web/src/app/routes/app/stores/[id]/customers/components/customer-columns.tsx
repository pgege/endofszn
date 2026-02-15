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
import type { Customer } from '@/lib/api/customers'

export function createCustomerColumns(storeId: string): ColumnDef<Customer>[] {
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
      id: 'name',
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      accessorFn: (row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || '—',
      cell: ({ row }) => {
        const name = `${row.original.first_name || ''} ${row.original.last_name || ''}`.trim()
        return (
          <Link
            to={paths.app.stores.customers.detail.getHref(storeId, row.original.id)}
            className="text-sm font-medium hover:underline"
          >
            {name || '—'}
          </Link>
        )
      },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <SortableHeader column={column} title="Email" />,
      cell: ({ row }) => <span className="text-sm">{row.original.email}</span>,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.phone || '—'}</span>
      ),
    },
    {
      id: 'account',
      accessorKey: 'has_account',
      header: 'Account',
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={row.original.has_account ? 'default' : 'secondary'}>
          {row.original.has_account ? 'Registered' : 'Guest'}
        </Badge>
      ),
    },
    {
      id: 'created',
      accessorKey: 'created_at',
      header: ({ column }) => <SortableHeader column={column} title="Joined" />,
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
              <Link to={paths.app.stores.customers.detail.getHref(storeId, row.original.id)}>
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
