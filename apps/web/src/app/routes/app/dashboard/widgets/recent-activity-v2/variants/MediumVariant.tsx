import { Bot, User } from 'lucide-react'
import { useRecentActivityContext } from '../context'

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function MediumVariant() {
  const { events } = useRecentActivityContext()

  return (
    <div className="h-full overflow-auto -mx-1 px-1">
      <div className="space-y-1">
        {events.map((event) => (
          <div key={event.id} className="flex items-start gap-2 p-2 hover:bg-muted/30 transition-colors">
            {event.source === 'agent' ? (
              <Bot className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
            ) : (
              <User className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate">
                <span className="font-medium capitalize">{event.entity} {event.action}</span>
              </p>
              {event.entityId && (
                <p className="text-[10px] text-muted-foreground truncate">{event.entityId}</p>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(event.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
