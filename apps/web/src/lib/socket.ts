import { io, Socket } from 'socket.io-client'

type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
type StatusListener = (status: SocketStatus, error?: Error) => void
type MessageListener<T = unknown> = (data: T) => void

class SocketManager {
  private socket: Socket | null = null
  private statusListeners: Set<StatusListener> = new Set()
  private status: SocketStatus = 'disconnected'
  private channels: Set<string> = new Set()

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket
    }

    if (this.socket) {
      this.socket.connect()
      return this.socket
    }

    this.setStatus('connecting')

    this.socket = io({
      path: '/ws',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
    })

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id)
      this.setStatus('connected')
      this.channels.forEach((channel) => {
        this.socket?.emit('join', channel)
      })
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
      this.setStatus('disconnected')
      if (reason === 'io server disconnect') {
        this.socket?.connect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.log('[Socket] Connection error:', error.message)
      this.setStatus('error', error)
    })

    return this.socket
  }

  disconnect(): void {
    this.channels.clear()
    this.socket?.disconnect()
    this.socket = null
    this.setStatus('disconnected')
  }

  getSocket(): Socket | null {
    return this.socket
  }

  getStatus(): SocketStatus {
    return this.status
  }

  private setStatus(status: SocketStatus, error?: Error): void {
    this.status = status
    this.statusListeners.forEach((listener) => listener(status, error))
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener)
    listener(this.status)
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  joinChannel(channel: string): void {
    this.channels.add(channel)
    if (this.socket?.connected) {
      this.socket.emit('join', channel)
    }
  }

  leaveChannel(channel: string): void {
    this.channels.delete(channel)
    if (this.socket?.connected) {
      this.socket.emit('leave', channel)
    }
  }

  sendToChannel<T>(channel: string, message: T): void {
    if (this.socket?.connected) {
      this.socket.emit('message', { room: channel, message })
    }
  }

  onChannelMessage<T>(callback: MessageListener<{ from: string; message: T }>): () => void {
    const handler = (data: { from: string; message: T }) => callback(data)
    this.socket?.on('message', handler)
    return () => {
      this.socket?.off('message', handler)
    }
  }

  on<T>(event: string, callback: MessageListener<T>): () => void {
    this.socket?.on(event, callback as MessageListener)
    return () => {
      this.socket?.off(event, callback as MessageListener)
    }
  }

  emit<T>(event: string, data: T): void {
    this.socket?.emit(event, data)
  }
}

export const socketManager = new SocketManager()
