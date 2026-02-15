import { Activity } from 'lucide-react'
import { useRecentActivityContext } from '../context'

export function SmallVariant() {
  const { events } = useRecentActivityContext()

  return (
    <div className="h-full flex items-center gap-2">
      <Activity className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">
        {events.length} recent change{events.length !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
