import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { RichTextPreview } from '@/components/ui/rich-text-editor'
import { cn } from '@/lib/utils'

export function CollapsibleSection({ title, content }: { title: string; content: string }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!content) return null

  return (
    <div className="border">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium">{title}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
      </button>
      {isExpanded && (
        <div className="px-4 pb-4">
          <RichTextPreview content={content} />
        </div>
      )}
    </div>
  )
}
