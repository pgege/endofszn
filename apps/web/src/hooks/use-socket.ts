import { useEffect, useState, useCallback } from 'react'
import { socketManager } from '@/lib/socket'

type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export function useSocket() {
  const [status, setStatus] = useState<SocketStatus>(socketManager.getStatus())

  useEffect(() => {
    return socketManager.onStatusChange((newStatus) => {
      setStatus(newStatus)
    })
  }, [])

  const connect = useCallback(() => {
    socketManager.connect()
  }, [])

  const disconnect = useCallback(() => {
    socketManager.disconnect()
  }, [])

  return {
    status,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    connect,
    disconnect,
  }
}

export function useChannel<T = unknown>(channel: string) {
  const [messages, setMessages] = useState<Array<{ from: string; message: T }>>([])
  const { isConnected } = useSocket()

  useEffect(() => {
    if (!channel) return

    socketManager.joinChannel(channel)

    const unsubscribe = socketManager.onChannelMessage<T>((data) => {
      if ((data as any).room && (data as any).room !== channel) return
      setMessages((prev) => [...prev, data])
    })

    return () => {
      socketManager.leaveChannel(channel)
      unsubscribe()
    }
  }, [channel])

  const send = useCallback(
    (message: T) => {
      socketManager.sendToChannel(channel, message)
    },
    [channel]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    send,
    clearMessages,
    isConnected,
  }
}
