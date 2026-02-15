import { io, Socket } from 'socket.io-client'

type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
type StatusListener = (status: SocketStatus, error?: Error) => void
type MessageListener<T = unknown> = (data: T) => void

export interface WorkflowMessage {
  id: string
  type: string
  workflow_run_id: string
  timestamp: string
  payload: {
    content?: string
    message?: string
    data?: Record<string, unknown>
    callback_id?: string
    tool?: string
    args?: Record<string, unknown>
  }
}

class SocketManager {
  private socket: Socket | null = null
  private statusListeners: Set<StatusListener> = new Set()
  private status: SocketStatus = 'disconnected'
  private channels: Set<string> = new Set()
  private workflowRuns: Set<string> = new Set()
  private vendorRooms: Set<string> = new Set()

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
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
    })

    this.socket.on('connect', () => {
      this.setStatus('connected')
      this.channels.forEach((channel) => {
        this.socket?.emit('join', channel)
      })
      this.workflowRuns.forEach((workflowRunId) => {
        this.socket?.emit('workflow:join', { workflow_run_id: workflowRunId })
      })
      this.vendorRooms.forEach((vendorId) => {
        this.socket?.emit('vendor:join', { vendor_id: vendorId })
      })
    })

    this.socket.on('disconnect', (reason) => {
      this.setStatus('disconnected')
      if (reason === 'io server disconnect') {
        this.socket?.connect()
      }
    })

    this.socket.on('connect_error', (error) => {
      this.setStatus('error', error)
    })

    return this.socket
  }

  disconnect(): void {
    this.channels.clear()
    this.workflowRuns.clear()
    this.vendorRooms.clear()
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
    if (!this.socket) return () => {}
    const handler = (data: { from: string; message: T }) => callback(data)
    this.socket.on('message', handler)
    return () => {
      this.socket?.off('message', handler)
    }
  }

  on<T>(event: string, callback: MessageListener<T>): () => void {
    if (!this.socket) {
      return () => {}
    }
    this.socket.on(event, callback as MessageListener)
    return () => {
      this.socket?.off(event, callback as MessageListener)
    }
  }

  emit<T>(event: string, data: T): void {
    this.socket?.emit(event, data)
  }

  joinWorkflowRun(workflowRunId: string): void {
    this.workflowRuns.add(workflowRunId)
    if (this.socket?.connected) {
      this.socket.emit('workflow:join', { workflow_run_id: workflowRunId })
    }
  }

  leaveWorkflowRun(workflowRunId: string): void {
    this.workflowRuns.delete(workflowRunId)
    if (this.socket?.connected) {
      this.socket.emit('workflow:leave', { workflow_run_id: workflowRunId })
    }
  }

  sendWorkflowMessage(workflowRunId: string, content: string, context?: Record<string, unknown>): void {
    if (this.socket?.connected) {
      this.socket.emit('workflow:user_message', {
        workflow_run_id: workflowRunId,
        content,
        context,
      })
    }
  }

  sendWorkflowToolResponse(
    workflowRunId: string,
    callbackId: string,
    data?: Record<string, unknown>,
    error?: string
  ): void {
    if (this.socket?.connected) {
      this.socket.emit('workflow:tool_response', {
        workflow_run_id: workflowRunId,
        callback_id: callbackId,
        data,
        error,
      })
    }
  }

  cancelWorkflow(workflowRunId: string, taskId?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('workflow:cancel', { workflow_run_id: workflowRunId, task_id: taskId })
    }
  }

  joinVendorRoom(vendorId: string): void {
    this.vendorRooms.add(vendorId)
    if (this.socket?.connected) {
      this.socket.emit('vendor:join', { vendor_id: vendorId })
    }
  }

  leaveVendorRoom(vendorId: string): void {
    this.vendorRooms.delete(vendorId)
    if (this.socket?.connected) {
      this.socket.emit('vendor:leave', { vendor_id: vendorId })
    }
  }
}

export const socketManager = new SocketManager()
