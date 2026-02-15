import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { extractNavHints, type ChatMessage, type ChatAttachment } from './types'
import { NavChips } from './nav-chips'

function AttachmentGrid({ attachments }: { attachments: ChatAttachment[] }) {
  const [preview, setPreview] = useState<string | null>(null)

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-1">
        {attachments.map((att) => (
          <div key={att.id} className="relative group">
            {att.mimeType.startsWith('image/') ? (
              <img
                src={att.url}
                alt={att.filename}
                className="h-20 w-20 object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setPreview(att.url)}
              />
            ) : (
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-20 w-20 border flex items-center justify-center bg-muted text-xs text-center px-1 hover:bg-muted/80"
              >
                {att.filename}
              </a>
            )}
            {att.source === 'agent' && (
              <span className="absolute top-0.5 left-0.5 bg-violet-500/80 text-white text-[9px] px-1">
                AI
              </span>
            )}
          </div>
        ))}
      </div>
      {preview && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center cursor-pointer"
          onClick={() => setPreview(null)}
        >
          <img src={preview} alt="Preview" className="max-h-[80vh] max-w-[90vw] shadow-2xl" />
        </div>
      )}
    </>
  )
}

interface UserMessageProps {
  message: ChatMessage
}

function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="px-3 py-2 max-w-[85%] text-sm bg-primary text-primary-foreground">
        {message.attachments && message.attachments.length > 0 && (
          <AttachmentGrid attachments={message.attachments} />
        )}
        {message.content && (
          <div className="whitespace-pre-wrap wrap-break-word">{message.content}</div>
        )}
      </div>
    </div>
  )
}

interface AssistantMessageGroupProps {
  messages: ChatMessage[]
}

function AssistantMessageGroup({ messages }: AssistantMessageGroupProps) {
  const combinedContent = messages.map((m) => m.content).join('')
  const allAttachments = messages.flatMap((m) => m.attachments || [])

  const navHints = (() => {
    for (const m of messages) {
      const hints = extractNavHints((m.data as Record<string, unknown>)?.output)
      if (hints) return hints
    }
    return undefined
  })()

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <img src="/end-of-szn-logo.png" alt="Eugene" className="size-4" />
        <span className="text-xs font-medium text-muted-foreground">Eugene</span>
      </div>
      <div className="text-sm prose prose-sm dark:prose-invert max-w-none overflow-hidden prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-pre:my-2 prose-pre:bg-muted prose-pre:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-table:text-sm prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-td:border prose-th:border">
        {allAttachments.length > 0 && <AttachmentGrid attachments={allAttachments} />}
        {combinedContent && (
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ children, ...props }) => (
                <div className="overflow-x-auto">
                  <table {...props}>{children}</table>
                </div>
              ),
            }}
          >
            {combinedContent}
          </Markdown>
        )}
        {navHints && <NavChips hints={navHints} />}
      </div>
    </div>
  )
}

interface MessageGroupProps {
  messages: ChatMessage[]
  role: 'user' | 'assistant'
}

export function MessageGroup({ messages, role }: MessageGroupProps) {
  if (role === 'user') {
    return (
      <div className="space-y-2">
        {messages.map((message) => (
          <UserMessage key={message.id} message={message} />
        ))}
      </div>
    )
  }

  return <AssistantMessageGroup messages={messages} />
}
