import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LayoutGrid, List, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export type ViewMode = 'grid' | 'table'

export interface SortOption {
  label: string
  value: string
}

export interface FilterOption {
  label: string
  value: string
}

export interface BulkAction {
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
}

interface DataToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  sortOptions?: SortOption[]
  currentSort?: string
  onSortChange?: (value: string) => void
  statusFilter?: string
  onStatusFilterChange?: (value: string) => void
  categoryFilter?: string
  onCategoryFilterChange?: (value: string) => void
  categories?: FilterOption[]
  actions?: React.ReactNode
  selectedCount?: number
  onClearSelection?: () => void
  bulkActions?: BulkAction[]
}

export function DataToolbar({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortOptions,
  currentSort,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  actions,
  selectedCount = 0,
  onClearSelection,
  bulkActions,
}: DataToolbarProps) {
  const [localSearch, setLocalSearch] = useState(search)

  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, search, onSearchChange])

  if (selectedCount > 0 && bulkActions && bulkActions.length > 0) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClearSelection} className="gap-1.5">
            <X className="h-3.5 w-3.5" />
            {selectedCount} selected
          </Button>
          <div className="h-4 w-px bg-border" />
          {bulkActions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={action.onClick}
              className="gap-1.5"
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {onStatusFilterChange && (
          <Select value={statusFilter || 'all'} onValueChange={(v) => onStatusFilterChange(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        )}

        {onCategoryFilterChange && categories && categories.length > 0 && (
          <Select value={categoryFilter || 'all'} onValueChange={(v) => onCategoryFilterChange(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {onSortChange && sortOptions && (
          <Select value={currentSort || sortOptions[0]?.value} onValueChange={onSortChange}>
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center border">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={() => onViewModeChange('grid')}
            className="border-0"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={() => onViewModeChange('table')}
            className="border-0"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        {actions}
      </div>
    </div>
  )
}
