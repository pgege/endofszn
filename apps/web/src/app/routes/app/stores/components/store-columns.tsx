import { Link } from 'react-router-dom'
import { Store as StoreIcon, MoreHorizontal, Pencil, Trash2, Settings } from 'lucide-react'
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
import type { Store } from '@/lib/api/auth'

export function createStoreColumns(
  onDelete: (store: Store) => void,
): ColumnDef<Store>[] {
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
      id: 'logo',
      header: '',
      size: 50,
      enableSorting: false,
      cell: ({ row }) => {
        const src = row.original.profile?.logoUrl
        return src ? (
          <img src={src} alt="" className="h-10 w-10 object-cover bg-muted" />
        ) : (
          <div className="h-10 w-10 bg-muted flex items-center justify-center">
            <StoreIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        )
      },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <Link
          to={paths.app.stores.detail.getHref(row.original.id)}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={row.original.profile?.isPublished ? 'default' : 'secondary'}>
          {row.original.profile?.isPublished ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm line-clamp-1">
          {row.original.profile?.description || 'No description'}
        </span>
      ),
    },
    {
      id: 'created',
      accessorKey: 'createdAt',
      header: ({ column }) => <SortableHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.createdAt
            ? new Date(row.original.createdAt).toLocaleDateString()
            : '—'}
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
              <Link to={paths.app.stores.detail.getHref(row.original.id)}>
                <Pencil className="h-4 w-4 mr-2" />
                Manage
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={paths.app.stores.settings.getHref(row.original.id)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
