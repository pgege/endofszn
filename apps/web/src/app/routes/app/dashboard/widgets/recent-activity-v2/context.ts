import { createWidgetContext } from '../../components/primitives/widget-context'
import type { ActivityEvent } from './use-recent-activity'

export const { Provider: RecentActivityProvider, useContext: useRecentActivityContext } =
  createWidgetContext<{ events: ActivityEvent[] }>('RecentActivity')
