import type { ChatMessage, GroupedItem } from './types'

export function groupMessages(messages: ChatMessage[], isThinking: boolean): GroupedItem[] {
  const result: GroupedItem[] = []
  let currentThoughts: string[] = []
  let thinkingKey = ''
  let currentMessages: ChatMessage[] = []
  let currentRole: 'user' | 'assistant' | null = null

  const flushMessages = () => {
    if (currentMessages.length > 0 && currentRole) {
      result.push({
        type: 'messages',
        messages: currentMessages,
        role: currentRole,
        key: currentMessages[0].id,
      })
      currentMessages = []
      currentRole = null
    }
  }

  const flushThoughts = (isLast: boolean) => {
    if (currentThoughts.length > 0) {
      result.push({
        type: 'thinking',
        thoughts: currentThoughts,
        isLive: isThinking && isLast,
        key: thinkingKey,
      })
      currentThoughts = []
      thinkingKey = ''
    }
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]

    if (msg.type === 'end_of_turn' && !msg.content) {
      continue
    }

    if (msg.type === 'thinking') {
      flushMessages()
      if (currentThoughts.length === 0) {
        thinkingKey = msg.id
      }
      currentThoughts.push(msg.content)
    } else if (msg.type === 'workflow:clarification' || msg.type === 'clarification_response') {
      const isLastThinkingGroup = messages.slice(i).every((m) => m.type !== 'thinking')
      flushThoughts(isLastThinkingGroup)
      flushMessages()
      result.push({ type: 'clarification', message: msg, key: msg.id })
    } else {
      const isLastThinkingGroup = messages.slice(i).every((m) => m.type !== 'thinking')
      flushThoughts(isLastThinkingGroup)

      if (currentRole !== msg.role) {
        flushMessages()
        currentRole = msg.role
      }
      currentMessages.push(msg)
    }
  }

  flushMessages()
  flushThoughts(true)

  return result
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function getWorkflowRunPreview(messages?: { content: string }[]): string {
  if (messages && messages.length > 0) {
    const lastMsg = messages[0]
    return lastMsg.content.slice(0, 50) + (lastMsg.content.length > 50 ? '...' : '')
  }
  return 'No messages yet'
}
