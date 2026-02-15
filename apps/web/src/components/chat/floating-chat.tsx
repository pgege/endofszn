import { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { socketManager } from '@/lib/socket'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth'
import { useWorkflowChat } from '@/hooks/use-workflow-chat'
import { useWorkflowRuns } from '@/hooks/use-workflow-runs'
import { getWorkflows, type Workflow } from '@/lib/api/workflows'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { ClarificationPanel } from './clarification-panel'
import { WorkflowRunList } from './workflow-run-list'

interface FloatingChatProps {
  isOpen: boolean
  onClose: () => void
}

export function FloatingChat({ isOpen, onClose }: FloatingChatProps) {
  const { vendor } = useAuth()
  const [showHistory, setShowHistory] = useState(false)
  const [input, setInput] = useState('')
  const [activeWorkflowRunId, setActiveWorkflowRunId] = useState<string | null>(null)
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)

  const {
    messages,
    isThinking,
    isProcessing,
    isConnected,
    clarification,
    submitClarification,
    sendMessage,
    cancelRun,
    clearMessages,
    setInitialMessages,
  } = useWorkflowChat(activeWorkflowRunId)

  const {
    workflowRuns,
    workflowRunId,
    isLoading,
    isLoadingList,
    loadWorkflowRuns,
    selectWorkflowRun,
    createNewWorkflowRun,
    removeWorkflowRun,
    updateRunTitle,
  } = useWorkflowRuns({
    vendorId: vendor?.id,
    onMessagesLoaded: setInitialMessages,
    onMessagesCleared: clearMessages,
  })

  useEffect(() => {
    setActiveWorkflowRunId(workflowRunId)
  }, [workflowRunId])

  useEffect(() => {
    if (isOpen && vendor?.id) {
      getWorkflows(vendor.id).then((wfs) => {
        setWorkflows(wfs)
        if (wfs.length > 0 && !selectedWorkflowId) {
          setSelectedWorkflowId(wfs[0].id)
        }
      }).catch(() => {})
      loadWorkflowRuns().then((runs) => {
        if (runs && runs.length > 0 && !workflowRunId) {
          selectWorkflowRun(runs[0].id)
        }
      }).catch(() => {})
    }
  }, [isOpen, vendor?.id])

  useEffect(() => {
    const unsub = socketManager.on<{ workflow_run_id: string; title: string }>(
      'workflow:title_updated',
      (data) => {
        updateRunTitle(data.workflow_run_id, data.title)
      }
    )
    return unsub
  }, [updateRunTitle])

  const handleSend = useCallback(
    (attachments?: import('./types').ChatAttachment[]) => {
      if ((!input.trim() && (!attachments || attachments.length === 0)) || isProcessing || !selectedWorkflowId) return
      sendMessage(input, { workflowId: selectedWorkflowId }, attachments)
      setInput('')
    },
    [input, isProcessing, sendMessage, selectedWorkflowId]
  )

  const handleNewWorkflowRun = useCallback(async () => {
    const run = await createNewWorkflowRun()
    if (run) {
      setShowHistory(false)
    }
  }, [createNewWorkflowRun])

  const handleSelectWorkflowRun = useCallback(
    async (id: string) => {
      await selectWorkflowRun(id)
      setShowHistory(false)
    },
    [selectWorkflowRun]
  )

  if (!vendor || !isOpen) return null

  return (
    <div className="fixed top-16 right-6 z-50 w-xl h-[calc(100vh-3.5rem-1rem)] bg-background border shadow-xl flex flex-col overflow-hidden">
      {showHistory ? (
        <WorkflowRunList
          workflowRuns={workflowRuns}
          currentId={workflowRunId}
          isLoading={isLoadingList}
          onSelect={handleSelectWorkflowRun}
          onDelete={removeWorkflowRun}
          onBack={() => setShowHistory(false)}
        />
      ) : (
        <>
          <ChatHeader
            isConnected={isConnected}
            isLoading={isLoading}
            onShowHistory={() => setShowHistory(true)}
            onNew={handleNewWorkflowRun}
            onClose={onClose}
          />

          {!workflowRunId ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <Button onClick={handleNewWorkflowRun} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Start a conversation
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <ChatMessages messages={messages} isThinking={isThinking} isProcessing={isProcessing} />
              {clarification?.active && (
                <ClarificationPanel
                  state={clarification}
                  onSubmit={submitClarification}
                />
              )}
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                onCancel={cancelRun}
                isDisabled={isProcessing || !selectedWorkflowId || !!clarification?.active}
                isProcessing={isProcessing}
                toolbarLeft={
                  workflows.length > 0 ? (
                    <Select
                      value={selectedWorkflowId ?? undefined}
                      onValueChange={setSelectedWorkflowId}
                    >
                      <SelectTrigger className="h-6 text-[11px] border-0 bg-transparent shadow-none px-1.5 gap-1 text-muted-foreground hover:text-foreground w-auto">
                        <SelectValue placeholder="Workflow..." />
                      </SelectTrigger>
                      <SelectContent>
                        {workflows.map((wf) => (
                          <SelectItem key={wf.id} value={wf.id} className="text-xs">
                            {wf.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null
                }
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
