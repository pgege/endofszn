import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight, Brain, Loader2 } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface ThinkingBlockProps {
  thoughts: string[]
  isLive: boolean
}

export function ThinkingBlock({ thoughts, isLive }: ThinkingBlockProps) {
  const [open, setOpen] = useState(isLive)
  const prevIsLive = useRef(isLive)

  useEffect(() => {
    if (isLive && !prevIsLive.current) {
      setOpen(true)
    } else if (!isLive && prevIsLive.current) {
      setOpen(false)
    }
    prevIsLive.current = isLive
  }, [isLive])

  if (thoughts.length === 0) return null

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        <Brain className="size-3" />
        <span className="italic">
          {isLive ? 'Thinking...' : `Thought process (${thoughts.length})`}
        </span>
        {isLive && <Loader2 className="size-3 animate-spin ml-1" />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-5 border-l border-muted-foreground/20 ml-1.5 mt-1 space-y-1">
          {thoughts.map((thought, idx) => (
            <p key={idx} className="text-xs text-muted-foreground italic">
              {thought}
            </p>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
