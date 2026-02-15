import { Link } from 'react-router-dom'
import { Store as StoreIcon, Settings } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { SortableHeader } from '@/components/sortable-header'
import { paths } from '@/config/paths'
import type { Store } from '@/lib/api/auth'

export const storeColumns: ColumnDef<Store>[] = [
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
      const url = row.original.profile?.logoUrl
      return url ? (
        <img src={url} alt="" className="h-10 w-10 object-cover bg-muted" />
      ) : (
        <div className="h-10 w-10 bg-primary/10 flex items-center justify-center">
          <StoreIcon className="h-4 w-4 text-primary" />
        </div>
      )
    },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <Link to={paths.app.stores.detail.getHref(row.original.id)} className="font-medium hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    id: 'status',
    header: ({ column }) => <SortableHeader column={column} title="Status" />,
    accessorFn: (row) => row.profile?.isPublished ? 'Published' : 'Draft',
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
    id: 'actions',
    header: '',
    size: 40,
    enableSorting: false,
    cell: ({ row }) => (
      <Button variant="ghost" size="icon-sm" asChild>
        <Link to={paths.app.stores.settings.getHref(row.original.id)}>
          <Settings className="h-4 w-4" />
        </Link>
      </Button>
    ),
  },
]
