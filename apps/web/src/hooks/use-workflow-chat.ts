import { useEffect, useState, useCallback, useRef } from 'react'
import { socketManager, WorkflowMessage } from '@/lib/socket'
import { extractContent, type ChatMessage, type ChatAttachment } from '@/components/chat/types'
import type { ClarificationState } from '@/components/chat/clarification-panel'

type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface ToolRequest {
  callbackId: string
  tool: string
  args: Record<string, unknown>
}

interface UseWorkflowChatReturn {
  status: SocketStatus
  isConnected: boolean
  isProcessing: boolean
  isThinking: boolean
  messages: ChatMessage[]
  pendingToolRequest: ToolRequest | null
  clarification: ClarificationState | null
  submitClarification: (answers: Record<string, string | string[]>) => void
  sendMessage: (content: string, context?: Record<string, unknown>, attachments?: ChatAttachment[]) => void
  cancelRun: () => void
  clearMessages: () => void
  setInitialMessages: (messages: ChatMessage[]) => void
}

export function useWorkflowChat(workflowRunId: string | null): UseWorkflowChatReturn {
  const [status, setStatus] = useState<SocketStatus>(socketManager.getStatus())
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pendingToolRequest, setPendingToolRequest] = useState<ToolRequest | null>(null)
  const [clarification, setClarification] = useState<ClarificationState | null>(null)
  const streamingMessageRef = useRef<string | null>(null)
  const isCatchingUpRef = useRef(false)

  useEffect(() => {
    return socketManager.onStatusChange((newStatus) => {
      setStatus(newStatus)
    })
  }, [])

  useEffect(() => {
    if (!workflowRunId) return

    socketManager.connect()
    socketManager.joinWorkflowRun(workflowRunId)

    const unsubThinking = socketManager.on<WorkflowMessage>('workflow:thinking', (msg) => {
      if (msg.workflow_run_id !== workflowRunId) return
      if (isCatchingUpRef.current) return
      setIsProcessing(true)
      setIsThinking(true)

      setMessages((prev) => {
        let updated = prev.map((m) =>
          m.type === 'text_delta' && m.isStreaming ? { ...m, isStreaming: false } : m
        )

        const existingThinkingIdx = updated.findIndex(
          (m) => m.type === 'thinking' && m.isStreaming
        )
        if (existingThinkingIdx >= 0) {
          return updated.map((m, idx) =>
            idx === existingThinkingIdx
              ? { ...m, content: m.content + (msg.payload.content || '') }
              : m
          )
        }
        return [
          ...updated,
          {
            id: msg.id,
            role: 'assistant',
            type: 'thinking',
            content: msg.payload.content || '',
            timestamp: msg.timestamp,
            isStreaming: true,
          },
        ]
      })
    })

    const unsubTextDelta = socketManager.on<WorkflowMessage>('workflow:text_delta', (msg) => {
      if (msg.workflow_run_id !== workflowRunId) return
      if (isCatchingUpRef.current) return
      setIsProcessing(true)
      setIsThinking(false)

      setMessages((prev) => {
        const existingTextIdx = prev.findIndex(
          (m) => m.type === 'text_delta' && m.isStreaming
        )

        if (existingTextIdx >= 0) {
          return prev.map((m, idx) =>
            idx === existingTextIdx
              ? { ...m, content: m.content + (msg.payload.content || '') }
              : m
          )
        }

        streamingMessageRef.current = msg.id
        const updated = prev.map((m) =>
          m.type === 'thinking' && m.isStreaming
            ? { ...m, isStreaming: false }
            : m
        )
        return [
          ...updated,
          {
            id: msg.id,
            role: 'assistant',
            type: 'text_delta',
            content: msg.payload.content || '',
            timestamp: msg.timestamp,
            isStreaming: true,
          },
        ]
      })
    })

    const unsubEndOfTurn = socketManager.on<WorkflowMessage>('workflow:end_of_turn', (msg) => {
      if (msg.workflow_run_id !== workflowRunId) return
      setIsProcessing(false)
      setIsThinking(false)
      streamingMessageRef.current = null

      if (isCatchingUpRef.current) {
        isCatchingUpRef.current = false
        const flushed = msg.payload.flushed as { thinking: string | null; text: string | null } | undefined
        const finalContent = extractContent(msg.payload.data?.output)

        setMessages((prev) => {
          const newMsgs = [...prev]
          if (flushed?.thinking) {
            newMsgs.push({
              id: `thinking-catchup-${Date.now()}`,
              role: 'assistant',
              type: 'thinking',
              content: flushed.thinking,
              timestamp: msg.timestamp,
            })
          }
          if (finalContent) {
            newMsgs.push({
              id: msg.id,
              role: 'assistant',
              type: 'text_delta',
              content: finalContent,
              data: msg.payload.data,
              timestamp: msg.timestamp,
            })
          }
          return newMsgs
        })
        return
      }

      setMessages((prev) => {
        const finalContent = extractContent(msg.payload.data?.output)

        const hasStreaming = prev.some((m) => m.isStreaming)
        if (hasStreaming) {
          return prev.map((m) => {
            if (!m.isStreaming) return m
            if (m.type === 'text_delta') {
              return {
                ...m,
                isStreaming: false,
                content: finalContent || m.content,
                data: msg.payload.data,
              }
            }
            return { ...m, isStreaming: false }
          })
        }

        if (finalContent) {
          return [
            ...prev,
            {
              id: msg.id,
              role: 'assistant',
              type: 'end_of_turn',
              content: finalContent,
              data: msg.payload.data,
              timestamp: msg.timestamp,
            },
          ]
        }
        return prev
      })
    })

    const unsubError = socketManager.on<WorkflowMessage>('workflow:error', (msg) => {
      if (msg.workflow_run_id !== workflowRunId) return
      setIsProcessing(false)
      setIsThinking(false)
      setPendingToolRequest(null)
      streamingMessageRef.current = null

      if (isCatchingUpRef.current) {
        isCatchingUpRef.current = false
        const flushed = msg.payload?.flushed as { thinking: string | null; text: string | null } | undefined

        setMessages((prev) => {
          const newMsgs = [...prev]
          if (flushed?.thinking) {
            newMsgs.push({
              id: `thinking-catchup-${Date.now()}`,
              role: 'assistant',
              type: 'thinking',
              content: flushed.thinking,
              timestamp: msg.timestamp || new Date().toISOString(),
            })
          }
          if (flushed?.text) {
            newMsgs.push({
              id: `text-catchup-${Date.now()}`,
              role: 'assistant',
              type: 'text_delta',
              content: flushed.text,
              timestamp: msg.timestamp || new Date().toISOString(),
            })
          }
          newMsgs.push({
            id: msg.id || `error-${Date.now()}`,
            role: 'assistant',
            type: 'error',
            content: msg.payload?.message || msg.payload?.content || 'An error occurred',
            timestamp: msg.timestamp || new Date().toISOString(),
          })
          return newMsgs
        })
        return
      }

      setMessages((prev) => [
        ...prev,
        {
          id: msg.id || `error-${Date.now()}`,
          role: 'assistant',
          type: 'error',
          content: msg.payload?.message || msg.payload?.content || 'An error occurred',
          timestamp: msg.timestamp || new Date().toISOString(),
        },
      ])
    })

    const unsubAttachment = socketManager.on<{ workflow_run_id: string; attachment: ChatAttachment }>('workflow:attachment', (data) => {
      if (data.workflow_run_id !== workflowRunId) return
      const att = data.attachment
      setMessages((prev) => {
        const lastAssistant = [...prev].reverse().find((m) => m.role === 'assistant' && !m.isStreaming)
        if (lastAssistant) {
          return prev.map((m) =>
            m.id === lastAssistant.id
              ? { ...m, attachments: [...(m.attachments || []), att] }
              : m
          )
        }
        return [
          ...prev,
          {
            id: `att-${Date.now()}`,
            role: 'assistant',
            type: 'attachment',
            content: '',
            attachments: [att],
            timestamp: new Date().toISOString(),
          },
        ]
      })
    })

    const unsubToolRequest = socketManager.on<WorkflowMessage>('workflow:tool_request', (msg) => {
      if (msg.workflow_run_id !== workflowRunId) return

      const { callback_id, tool, args } = msg.payload
      if (callback_id && tool) {
        setPendingToolRequest({
          callbackId: callback_id as string,
          tool: tool as string,
          args: (args as Record<string, unknown>) || {},
        })
      }
    })

    const unsubClarification = socketManager.on<WorkflowMessage>('workflow:clarification', (msg) => {
      if (msg.workflow_run_id !== workflowRunId) return
      const { callback_id, context, questions } = msg.payload
      const wasCatchingUp = isCatchingUpRef.current

      if (wasCatchingUp) {
        isCatchingUpRef.current = false
        setIsProcessing(false)
        setIsThinking(false)
      }

      if (callback_id && questions) {
        setClarification({
          active: true,
          callbackId: callback_id as string,
          workflowRunId: msg.workflow_run_id,
          context: (context as string) || '',
          questions: questions as ClarificationState['questions'],
        })

        setMessages((prev) => {
          let newMsgs = [...prev]

          if (wasCatchingUp) {
            const flushed = msg.payload.flushed as { thinking: string | null; text: string | null } | undefined
            if (flushed?.thinking) {
              newMsgs.push({
                id: `thinking-catchup-${Date.now()}`,
                role: 'assistant',
                type: 'thinking',
                content: flushed.thinking,
                timestamp: msg.timestamp,
              })
            }
            if (flushed?.text) {
              newMsgs.push({
                id: `text-catchup-${Date.now()}`,
                role: 'assistant',
                type: 'text_delta',
                content: flushed.text,
                timestamp: msg.timestamp,
              })
            }
          } else {
            newMsgs = newMsgs.map((m) =>
              (m.type === 'text_delta' || m.type === 'thinking') && m.isStreaming
                ? { ...m, isStreaming: false }
                : m
            )
          }

          newMsgs.push({
            id: `clarify-req-${Date.now()}`,
            role: 'assistant',
            type: 'workflow:clarification',
            content: '',
            data: { context, questions },
            timestamp: new Date().toISOString(),
          })

          return newMsgs
        })
      }
    })

    const unsubJoined = socketManager.on<{
      workflow_run_id: string
      catch_up: {
        isProcessing: boolean
        pendingInteraction: { type: string; data: Record<string, unknown> } | null
      } | null
    }>('workflow:joined', (data) => {
      if (data.workflow_run_id !== workflowRunId || !data.catch_up) return

      if (streamingMessageRef.current) return

      if (data.catch_up.isProcessing) {
        isCatchingUpRef.current = true
        setIsProcessing(true)
        setIsThinking(true)
      }

      if (data.catch_up.pendingInteraction) {
        const pi = data.catch_up.pendingInteraction
        if (pi.type === 'workflow:clarification') {
          setClarification({
            active: true,
            callbackId: pi.data.callback_id as string,
            workflowRunId,
            context: (pi.data.context as string) || '',
            questions: pi.data.questions as ClarificationState['questions'],
          })
        } else if (pi.type === 'workflow:tool_request') {
          setPendingToolRequest({
            callbackId: pi.data.callback_id as string,
            tool: pi.data.tool as string,
            args: (pi.data.args as Record<string, unknown>) || {},
          })
        }
      }
    })

    return () => {
      unsubThinking()
      unsubTextDelta()
      unsubEndOfTurn()
      unsubError()
      unsubAttachment()
      unsubToolRequest()
      unsubClarification()
      unsubJoined()
      isCatchingUpRef.current = false
      socketManager.leaveWorkflowRun(workflowRunId)
    }
  }, [workflowRunId])

  const sendMessage = useCallback(
    (content: string, context?: Record<string, unknown>, attachments?: ChatAttachment[]) => {
      if (!workflowRunId || (!content.trim() && (!attachments || attachments.length === 0))) return

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        type: 'user_message',
        content: content.trim(),
        attachments,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsProcessing(true)
      streamingMessageRef.current = null

      const fullContext = {
        ...context,
        ...(attachments && attachments.length > 0
          ? { attachments: attachments.map((a) => ({ id: a.id, url: a.url, filename: a.filename, mimeType: a.mimeType })) }
          : {}),
      }
      socketManager.sendWorkflowMessage(workflowRunId, content.trim(), fullContext)
    },
    [workflowRunId]
  )

  const submitClarification = useCallback(
    (answers: Record<string, string | string[]>) => {
      if (!clarification || !workflowRunId) return

      const { questions, context } = clarification

      socketManager.emit('workflow:clarification_response', {
        workflow_run_id: workflowRunId,
        callback_id: clarification.callbackId,
        answers,
        questions,
        context,
      })

      setMessages((prev) => {
        const withoutRequest = [...prev]
        const reqIdx = withoutRequest.findLastIndex((m) => m.type === 'workflow:clarification')
        if (reqIdx !== -1) withoutRequest.splice(reqIdx, 1)
        return [
          ...withoutRequest,
          {
            id: `clarify-${Date.now()}`,
            role: 'user',
            type: 'clarification_response',
            content: '',
            data: {
              context,
              questions,
              answers,
            },
            timestamp: new Date().toISOString(),
          },
        ]
      })

      setClarification(null)
    },
    [clarification, workflowRunId]
  )

  const cancelRun = useCallback(() => {
    if (workflowRunId) {
      socketManager.cancelWorkflow(workflowRunId)
    }
  }, [workflowRunId])

  const clearMessages = useCallback(() => {
    setMessages([])
    setIsThinking(false)
    setIsProcessing(false)
    setPendingToolRequest(null)
    setClarification(null)
    streamingMessageRef.current = null
  }, [])

  const setInitialMessages = useCallback((initialMessages: ChatMessage[]) => {
    setMessages(initialMessages)
    setIsThinking(false)
    streamingMessageRef.current = null
  }, [])

  return {
    status,
    isConnected: status === 'connected',
    isProcessing,
    isThinking,
    messages,
    pendingToolRequest,
    clarification,
    submitClarification,
    sendMessage,
    cancelRun,
    clearMessages,
    setInitialMessages,
  }
}
