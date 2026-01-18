import { useEffect, useRef } from 'react'
import { socketManager } from '@/lib/socket'
import { toast } from 'sonner'

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const hasConnected = useRef(false)

  useEffect(() => {
    const unsubscribe = socketManager.onStatusChange((status, error) => {
      console.log('[SocketProvider] Status changed:', status)
      if (status === 'connected' && !hasConnected.current) {
        hasConnected.current = true
        toast.success('Connected to server')
      } else if (status === 'disconnected' && hasConnected.current) {
        hasConnected.current = false
        toast.info('Disconnected from server')
      } else if (status === 'error') {
        toast.error(error?.message || 'Connection error')
      }
    })

    socketManager.connect()

    return () => {
      unsubscribe()
    }
  }, [])

  return <>{children}</>
}
