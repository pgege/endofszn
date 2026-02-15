import { useState, useCallback } from 'react'
import {
  createWorkflowRun,
  getWorkflowRuns,
  getWorkflowRun,
  deleteWorkflowRun,
  WorkflowRun,
  Message,
} from '@/lib/api/workflow-runs'
import type { ChatMessage } from '@/components/chat/types'

interface UseWorkflowRunsOptions {
  vendorId: string | undefined
  onMessagesLoaded: (messages: ChatMessage[]) => void
  onMessagesCleared: () => void
}

export function useWorkflowRuns({
  vendorId,
  onMessagesLoaded,
  onMessagesCleared,
}: UseWorkflowRunsOptions) {
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([])
  const [workflowRunId, setWorkflowRunId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingList, setIsLoadingList] = useState(false)

  const loadWorkflowRuns = useCallback(async () => {
    if (!vendorId) return
    setIsLoadingList(true)
    try {
      const runs = await getWorkflowRuns(vendorId)
      setWorkflowRuns(runs)
      return runs
    } catch (error) {
      console.error('Failed to load workflow runs:', error)
      return []
    } finally {
      setIsLoadingList(false)
    }
  }, [vendorId])

  const selectWorkflowRun = useCallback(
    async (id: string) => {
      setIsLoading(true)
      try {
        const run = await getWorkflowRun(id)
        setWorkflowRunId(id)
        if (run.messages && run.messages.length > 0) {
          const chatMessages: ChatMessage[] = run.messages.map((m: Message) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            type: m.type,
            content: m.content,
            data: m.data,
            attachments: m.attachments?.map((a) => ({
              id: a.id,
              url: a.url,
              filename: a.filename,
              mimeType: a.mimeType,
              source: a.source,
            })),
            timestamp: m.createdAt,
          }))
          onMessagesLoaded(chatMessages)
        } else {
          onMessagesCleared()
        }
      } catch (error) {
        console.error('Failed to load workflow run:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [onMessagesLoaded, onMessagesCleared]
  )

  const createNewWorkflowRun = useCallback(async () => {
    if (!vendorId) return null
    setIsLoading(true)
    try {
      const run = await createWorkflowRun(vendorId)
      setWorkflowRuns((prev) => [run, ...prev])
      setWorkflowRunId(run.id)
      onMessagesCleared()
      return run
    } catch (error) {
      console.error('Failed to create workflow run:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [vendorId, onMessagesCleared])

  const removeWorkflowRun = useCallback(async (id: string) => {
    try {
      await deleteWorkflowRun(id)
      setWorkflowRuns((prev) => prev.filter((r) => r.id !== id))
      if (workflowRunId === id) {
        setWorkflowRunId(null)
        onMessagesCleared()
      }
      return true
    } catch (error) {
      console.error('Failed to delete workflow run:', error)
      return false
    }
  }, [workflowRunId, onMessagesCleared])

  const updateRunTitle = useCallback((id: string, title: string) => {
    setWorkflowRuns((prev) =>
      prev.map((r) => (r.id === id ? { ...r, title } : r))
    )
  }, [])

  return {
    workflowRuns,
    workflowRunId,
    isLoading,
    isLoadingList,
    loadWorkflowRuns,
    selectWorkflowRun,
    createNewWorkflowRun,
    removeWorkflowRun,
    updateRunTitle,
  }
}
