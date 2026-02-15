import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, FolderTree, FolderOpen, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/api/categories'

export function TreeCategoryItem({
  category,
  depth = 0,
  expandedIds,
  onToggleExpand,
  onAddChild,
  onEdit,
  onDelete,
  getChildren,
}: {
  category: Category
  depth?: number
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onAddChild: (parentId: string) => void
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  getChildren: (parentId: string) => Category[]
}) {
  const children = getChildren(category.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(category.id)
  const isLeaf = !hasChildren

  return (
    <div>
      <div className={cn('flex items-center gap-2 py-2 px-3 hover:bg-muted/50 group transition-colors', depth > 0 && 'ml-4')}>
        <button
          type="button"
          onClick={() => hasChildren && onToggleExpand(category.id)}
          className={cn('w-6 h-6 flex items-center justify-center hover:bg-muted transition-colors', !hasChildren && 'invisible')}
        >
          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>

        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-primary shrink-0" />
        ) : isLeaf ? (
          <FolderTree className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
        )}

        <span className={cn('font-medium flex-1 truncate', !category.is_active && 'text-muted-foreground')}>{category.name}</span>

        {isLeaf && <Badge variant="outline" className="text-xs shrink-0">Leaf</Badge>}
        {!category.is_active && <Badge variant="secondary" className="text-xs shrink-0">Inactive</Badge>}

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddChild(category.id)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add subcategory</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(category)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(category)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="border-l border-muted ml-6">
          {children.map(child => (
            <TreeCategoryItem
              key={child.id}
              category={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              getChildren={getChildren}
            />
          ))}
        </div>
      )}
    </div>
  )
}
