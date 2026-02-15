import { Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function WidgetLoadingState() {
  return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  )
}

interface WidgetEmptyStateProps {
  message: string
  icon?: LucideIcon
}

export function WidgetEmptyState({ message, icon: Icon }: WidgetEmptyStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
      {Icon && <Icon className="h-5 w-5" />}
      <p className="text-sm text-center">{message}</p>
    </div>
  )
}
