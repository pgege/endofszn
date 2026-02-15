import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  PaginationState,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount?: number
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (selection: RowSelectionState) => void
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  manualSorting?: boolean
  manualPagination?: boolean
  getRowId?: (row: TData) => string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  pagination,
  onPaginationChange,
  rowSelection,
  onRowSelectionChange,
  sorting,
  onSortingChange,
  manualSorting = true,
  manualPagination = true,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      pagination,
      ...(sorting !== undefined && { sorting }),
      ...(rowSelection !== undefined && { rowSelection }),
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater
      onPaginationChange(next)
    },
    ...(onSortingChange && {
      onSortingChange: (updater) => {
        const next = typeof updater === 'function' ? updater(sorting ?? []) : updater
        onSortingChange(next)
      },
    }),
    ...(onRowSelectionChange && {
      onRowSelectionChange: (updater) => {
        const next = typeof updater === 'function' ? updater(rowSelection ?? {}) : updater
        onRowSelectionChange(next)
      },
    }),
    getCoreRowModel: getCoreRowModel(),
    ...(!manualSorting && { getSortedRowModel: getSortedRowModel() }),
    ...(!manualPagination && { getPaginationRowModel: getPaginationRowModel() }),
    ...(manualPagination && pageCount !== undefined && { pageCount }),
    manualPagination,
    manualSorting,
    enableRowSelection: !!onRowSelectionChange,
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/50 border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-0">
                {headerGroup.headers.map((header, i) => (
                  <TableHead
                    key={header.id}
                    className={cn(i === 0 && 'pl-6', i === headerGroup.headers.length - 1 && 'pr-6')}
                    style={header.column.getSize() !== 150 ? { width: header.column.getSize() } : undefined}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell, i) => (
                    <TableCell key={cell.id} className={cn(i === 0 && 'pl-6', i === row.getVisibleCells().length - 1 && 'pr-6')}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
