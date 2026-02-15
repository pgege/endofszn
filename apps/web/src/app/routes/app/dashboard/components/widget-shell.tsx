import { type ReactNode } from 'react'
import { GripVertical, MoreVertical, Check, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { WidgetSize } from '../types'
import { cn } from '@/lib/utils'

interface WidgetShellProps {
  title: string
  size: WidgetSize
  icon?: LucideIcon
  editMode?: boolean
  onRemove?: () => void
  onResize?: (size: WidgetSize) => void
  availableSizes?: WidgetSize[]
  children: ReactNode
  className?: string
}

const sizePadding: Record<WidgetSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

const sizeLabels: Record<WidgetSize, string> = {
  sm: 'Small (2x1)',
  md: 'Medium (3x2)',
  lg: 'Large (6x3)',
}

export function WidgetShell({
  title,
  size,
  icon: Icon,
  editMode = false,
  onRemove,
  onResize,
  availableSizes = [],
  children,
  className,
}: WidgetShellProps) {
  const showControls = editMode && (onRemove || onResize)

  return (
    <div className={cn('h-full flex flex-col bg-card border shadow-sm overflow-hidden', className)}>
      <div className={cn(
        'drag-handle flex items-center gap-2 px-3 py-2 border-b bg-muted/30 shrink-0',
        editMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
      )}>
        {editMode && <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />}
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="text-xs font-medium text-muted-foreground flex-1 truncate">{title}</span>
        {showControls && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onResize && availableSizes.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Size
                  </DropdownMenuLabel>
                  {availableSizes.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      disabled={s === size}
                      onClick={() => s !== size && onResize(s)}
                    >
                      {s === size && <Check className="h-3.5 w-3.5 mr-2 text-primary" />}
                      {s !== size && <span className="w-3.5 mr-2" />}
                      {sizeLabels[s]}
                    </DropdownMenuItem>
                  ))}
                  {onRemove && <DropdownMenuSeparator />}
                </>
              )}
              {onRemove && (
                <DropdownMenuItem onClick={onRemove} className="text-destructive">
                  <X className="h-3.5 w-3.5 mr-2" />Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className={cn('flex-1 overflow-auto', sizePadding[size])}>
        {children}
      </div>
    </div>
  )
}
