import { Activity } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import type { WidgetProps } from '../../types'
import { WidgetEmptyState } from '../../components/primitives/widget-states'
import { RecentActivityProvider } from './context'
import { useRecentActivity } from './use-recent-activity'
import { SmallVariant } from './variants/SmallVariant'
import { MediumVariant } from './variants/MediumVariant'

export function RecentActivityWidget({ size }: WidgetProps) {
  const { vendor } = useAuth()
  const { events } = useRecentActivity(vendor?.id)

  if (events.length === 0) {
    return (
      <WidgetEmptyState
        message="No recent activity. Changes will appear here in real-time."
        icon={Activity}
      />
    )
  }

  return (
    <RecentActivityProvider value={{ events }}>
      {size === 'sm' && <SmallVariant />}
      {(size === 'md' || size === 'lg') && <MediumVariant />}
    </RecentActivityProvider>
  )
}
