import { useState, useEffect, useCallback } from 'react'
import { socketManager } from '@/lib/socket'

export interface ActivityEvent {
  id: string
  entity: string
  action: string
  entityId?: string
  source: string
  timestamp: string
}

const MAX_EVENTS = 20

export function useRecentActivity(vendorId: string | undefined) {
  const [events, setEvents] = useState<ActivityEvent[]>([])

  const addEvent = useCallback((event: {
    entity: string
    action: string
    entity_id?: string
    source: string
    timestamp: string
  }) => {
    setEvents((prev) => {
      const newEvent: ActivityEvent = {
        id: `${event.timestamp}-${event.entity}-${event.action}`,
        entity: event.entity,
        action: event.action,
        entityId: event.entity_id,
        source: event.source,
        timestamp: event.timestamp,
      }
      return [newEvent, ...prev].slice(0, MAX_EVENTS)
    })
  }, [])

  useEffect(() => {
    if (!vendorId) return
    const unsub = socketManager.on<{
      entity: string
      action: string
      entity_id?: string
      source: string
      timestamp: string
    }>('store:entity_changed', addEvent)
    return unsub
  }, [vendorId, addEvent])

  return { events }
}
