import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { RichTextPreview } from '@/components/ui/rich-text-editor'
import { cn } from '@/lib/utils'

export function CollapsibleDescription({ description, expanded = false }: { description: string; expanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(expanded)

  if (!description || description === '<p></p>') return null

  const hasLongContent = description.length > 200

  return (
    <div className="space-y-2">
      <div className={cn(!isExpanded && hasLongContent && "relative")}>
        <RichTextPreview
          content={description}
          collapsed={!isExpanded && hasLongContent}
          className="text-muted-foreground"
        />
        {!isExpanded && hasLongContent && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-background to-transparent" />
        )}
      </div>
      {hasLongContent && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary flex items-center gap-1 hover:underline"
        >
          {isExpanded ? 'Show less' : 'Read more'}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")} />
        </button>
      )}
    </div>
  )
}
