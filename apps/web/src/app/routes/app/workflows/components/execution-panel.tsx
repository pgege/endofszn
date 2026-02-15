import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowUp, Square, Loader2, Brain, Trash2, MessageSquare, Braces, ChevronDown, Plus, History, AlertCircle, ImageIcon, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkflowChat } from '@/hooks/use-workflow-chat';
import { useWorkflowRuns } from '../hooks/use-workflow-runs';
import { useWorkflowInput } from '../hooks/use-workflow-input';
import { CodeEditor } from './code-editor';
import { uploadFile } from '@/lib/upload';
import { ClarificationPanel } from '@/components/chat/clarification-panel';
import { ClarificationSummary } from '@/components/chat/clarification-summary';
import type { ChatAttachment } from '@/components/chat/types';
import type { WorkflowDefinition } from '@/types/workflow';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ExecutionPanelProps {
  workflow: WorkflowDefinition;
  savedWorkflowId: string | null;
}

export function ExecutionPanel({ workflow, savedWorkflowId }: ExecutionPanelProps) {
  const [deleteRunTarget, setDeleteRunTarget] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    workflowRunId, setWorkflowRunId, allRuns, needsReset,
    loadPastRun, handleNewRun, handleDeleteRun, startRun, consumePendingMessage,
  } = useWorkflowRuns(savedWorkflowId);

  const {
    messages, isProcessing, isThinking, clarification, submitClarification,
    sendMessage, cancelRun, clearMessages, setInitialMessages,
  } = useWorkflowChat(workflowRunId);

  const {
    inputValue, setInputValue, inputMode, jsonError, handleModeChange,
  } = useWorkflowInput(workflow, messages.length);

  useEffect(() => {
    if (needsReset) clearMessages();
  }, [needsReset, clearMessages]);

  useEffect(() => {
    if (workflowRunId) {
      const pending = consumePendingMessage();
      if (pending) {
        const timer = setTimeout(() => sendMessage(pending.content, pending.context, pending.attachments), 100);
        return () => clearTimeout(timer);
      }
    }
  }, [workflowRunId, sendMessage, consumePendingMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLoadPastRun = useCallback(async (runId: string) => {
    const msgs = await loadPastRun(runId);
    if (msgs) setInitialMessages(msgs);
    else clearMessages();
  }, [loadPastRun, setInitialMessages, clearMessages]);

  const handleNew = useCallback(() => {
    handleNewRun();
    clearMessages();
  }, [handleNewRun, clearMessages]);

  const handleDelete = useCallback(async (runId: string) => {
    const wasActive = workflowRunId === runId;
    await handleDeleteRun(runId);
    if (wasActive) clearMessages();
  }, [handleDeleteRun, workflowRunId, clearMessages]);

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed && attachments.length === 0) return;
    if (inputMode === 'json') {
      try { JSON.parse(trimmed); } catch { return; }
    }

    const context: Record<string, unknown> = savedWorkflowId
      ? { workflowId: savedWorkflowId, workflow_override: workflow }
      : { workflow_override: workflow };

    const currentAttachments = attachments.length > 0 ? attachments : undefined;

    if (workflowRunId) {
      sendMessage(trimmed, context, currentAttachments);
    } else {
      const ok = await startRun(trimmed, context, currentAttachments);
      if (!ok) return;
    }
    setInputValue('');
    setAttachments([]);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [inputValue, inputMode, workflowRunId, workflow, sendMessage, savedWorkflowId, startRun, setInputValue, attachments]);

  const handleClear = useCallback(() => {
    clearMessages();
    setWorkflowRunId(null);
  }, [clearMessages, setWorkflowRunId]);

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const uploaded = await Promise.all(Array.from(files).map(uploadFile));
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (e) {
      console.error('Upload failed:', e);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const hasRuns = allRuns.length > 0 || workflowRunId !== null;
  const currentRunLabel = workflowRunId ? `Run ${workflowRunId.slice(0, 8)}` : 'New Run';

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase">Execution</span>
          {hasRuns && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2">
                  <History className="h-2.5 w-2.5" />
                  {currentRunLabel}
                  <ChevronDown className="h-2.5 w-2.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={handleNew} className="text-xs gap-2">
                  <Plus className="h-3 w-3" />
                  New Run
                </DropdownMenuItem>
                {allRuns.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {allRuns.map((run) => {
                      const lastMsg = run.messages?.[0];
                      const displayLabel = run.title || lastMsg?.content?.slice(0, 40) || 'No messages';
                      const isActive = run.id === workflowRunId;
                      return (
                        <DropdownMenuItem
                          key={run.id}
                          onClick={() => savedWorkflowId ? handleLoadPastRun(run.id) : setWorkflowRunId(run.id)}
                          className="text-xs flex items-center gap-1 group/run"
                        >
                          <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {run.id.slice(0, 8)} &middot; {new Date(run.createdAt).toLocaleDateString()}
                              {isActive && ' (active)'}
                            </span>
                            <span className="truncate w-full">{displayLabel}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setDeleteRunTarget(run.id);
                            }}
                            className="opacity-0 group-hover/run:opacity-100 p-0.5 hover:text-destructive shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </DropdownMenuItem>
                      );
                    })}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isThinking && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
              <Brain className="h-2.5 w-2.5" />
              Thinking
            </Badge>
          )}
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleClear}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 p-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
            <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Test "{workflow.name}"</p>
              <p className="text-[11px] text-muted-foreground/70">
                Type a message below to trigger this workflow. Your message becomes the trigger input.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) =>
              msg.type === 'workflow:clarification' || msg.type === 'clarification_response' ? (
                <ClarificationSummary key={msg.id} message={msg} />
              ) : msg.role === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="px-3 py-2 max-w-[85%] text-sm bg-primary text-primary-foreground">
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {msg.attachments.map((att) => (
                          att.mimeType.startsWith('image/') ? (
                            <img key={att.id} src={att.url} alt={att.filename} className="h-14 w-14 object-cover border border-primary-foreground/20" />
                          ) : (
                            <div key={att.id} className="h-14 w-14 border border-primary-foreground/20 flex items-center justify-center text-[9px] text-center px-0.5">{att.filename}</div>
                          )
                        ))}
                      </div>
                    )}
                    {msg.content && <div className="whitespace-pre-wrap break-words">{msg.content}</div>}
                  </div>
                </div>
              ) : msg.type === 'error' ? (
                <div key={msg.id} className="text-sm flex items-start gap-2 border border-destructive/30 bg-destructive/5 px-3 py-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                  <div className="text-destructive whitespace-pre-wrap break-words">{msg.content}</div>
                </div>
              ) : msg.type === 'thinking' ? (
                <div key={msg.id} className="text-sm text-muted-foreground italic flex items-start gap-1.5">
                  <Brain className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{msg.content}</span>
                </div>
              ) : (
                <div key={msg.id}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <img src="/end-of-szn-logo.png" alt="Eugene" className="size-3.5" />
                    <span className="text-[11px] font-medium text-muted-foreground">Eugene</span>
                  </div>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {msg.attachments.map((att) => (
                        att.mimeType.startsWith('image/') ? (
                          <img key={att.id} src={att.url} alt={att.filename} className="h-20 w-20 object-cover border" />
                        ) : (
                          <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="h-20 w-20 border flex items-center justify-center bg-muted text-xs text-center px-1 hover:bg-muted/80">{att.filename}</a>
                        )
                      ))}
                    </div>
                  )}
                  {msg.content && (
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-pre:my-2 prose-pre:bg-muted prose-pre:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
        {isProcessing && !isThinking && (
          <div className="flex items-center gap-1 px-1 py-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block size-1.5 bg-muted-foreground/60"
                style={{
                  animation: 'bounce-dot 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {clarification?.active && (
        <ClarificationPanel
          state={clarification}
          onSubmit={submitClarification}
        />
      )}

      <div className="shrink-0 p-2">
        <div
          className="border bg-muted/30 focus-within:ring-1 focus-within:ring-ring transition-shadow"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {inputMode === 'text' && attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pt-3">
              {attachments.map((att) => (
                <div key={att.id} className="relative group">
                  {att.mimeType.startsWith('image/') ? (
                    <img src={att.url} alt={att.filename} className="h-12 w-12 object-cover border" />
                  ) : (
                    <div className="h-12 w-12 border flex items-center justify-center bg-muted text-[9px] text-center px-0.5">{att.filename}</div>
                  )}
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {inputMode === 'text' ? (
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleTextKeyDown}
              placeholder="Type a message to trigger the workflow..."
              className="w-full resize-none bg-transparent px-3 pt-3 pb-1 text-xs placeholder:text-muted-foreground focus:outline-none"
              rows={3}
              disabled={isProcessing || !!clarification?.active}
              autoFocus
            />
          ) : (
            <div className="px-2 pt-2">
              <CodeEditor value={inputValue} onChange={setInputValue} language="json" minHeight="60px" maxHeight="100px" />
            </div>
          )}

          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-1">
              <Tabs value={inputMode} onValueChange={handleModeChange}>
                <TabsList className="h-6 bg-transparent">
                  <TabsTrigger value="text" className="text-[10px] px-1.5 h-5 gap-1 data-[state=active]:bg-muted">
                    <MessageSquare className="h-2.5 w-2.5" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="json" className="text-[10px] px-1.5 h-5 gap-1 data-[state=active]:bg-muted">
                    <Braces className="h-2.5 w-2.5" />
                    JSON
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {jsonError && inputMode === 'json' && (
                <span className="text-[10px] text-destructive">Invalid</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {inputMode === 'text' && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif,image/webp,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing || isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </>
              )}
              <Button
                size="icon"
                className="h-6 w-6"
                onClick={isProcessing ? cancelRun : () => { handleSend(); requestAnimationFrame(() => inputRef.current?.focus()); }}
                disabled={isProcessing ? false : (!inputValue.trim() && attachments.length === 0) || (inputMode === 'json' && !!jsonError)}
              >
                {isProcessing ? (
                  <Square className="h-2.5 w-2.5" />
                ) : (
                  <ArrowUp className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteRunTarget} onOpenChange={(open) => { if (!open) setDeleteRunTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete run</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow run? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteRunTarget) handleDelete(deleteRunTarget);
                setDeleteRunTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
