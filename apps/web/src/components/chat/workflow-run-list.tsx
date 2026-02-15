import { ChevronLeft, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatRelativeDate, getWorkflowRunPreview } from './utils'
import type { WorkflowRun } from './types'

interface WorkflowRunListProps {
  workflowRuns: WorkflowRun[]
  currentId: string | null
  isLoading: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onBack: () => void
}

export function WorkflowRunList({
  workflowRuns,
  currentId,
  isLoading,
  onSelect,
  onDelete,
  onBack,
}: WorkflowRunListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 border-b">
        <Button size="icon-sm" variant="ghost" onClick={onBack}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="font-medium text-sm">History</span>
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : workflowRuns.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            No history yet
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {workflowRuns.map((run) => (
              <div
                key={run.id}
                className={cn(
                  'w-full text-left p-3 transition-colors group relative',
                  run.id === currentId
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted'
                )}
              >
                <button
                  onClick={() => onSelect(run.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeDate(run.updatedAt)}
                    </span>
                  </div>
                  {run.title ? (
                    <p className="text-sm font-medium mt-1 line-clamp-1 pr-6">{run.title}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 pr-6">
                      {getWorkflowRunPreview(run.messages)}
                    </p>
                  )}
                </button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(run.id)
                  }}
                  title="Delete"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
