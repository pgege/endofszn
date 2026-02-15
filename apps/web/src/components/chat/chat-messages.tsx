import { useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ThinkingBlock } from './thinking-block'
import { MessageGroup } from './message-bubble'
import { ClarificationSummary } from './clarification-summary'
import { groupMessages } from './utils'
import type { ChatMessage } from './types'

function TypingIndicator() {
  return (
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
  )
}

interface ChatMessagesProps {
  messages: ChatMessage[]
  isThinking: boolean
  isProcessing?: boolean
}

export function ChatMessages({ messages, isThinking, isProcessing }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const groupedItems = groupMessages(messages, isThinking)

  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-3 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              Start a conversation by typing a message below.
            </div>
          ) : (
            <>
              {groupedItems.map((item) =>
                item.type === 'thinking' ? (
                  <ThinkingBlock key={item.key} thoughts={item.thoughts} isLive={item.isLive} />
                ) : item.type === 'clarification' ? (
                  <ClarificationSummary key={item.key} message={item.message} />
                ) : (
                  <MessageGroup key={item.key} messages={item.messages} role={item.role} />
                )
              )}
            </>
          )}
          {isProcessing && !isThinking && <TypingIndicator />}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
    </div>
  )
}
