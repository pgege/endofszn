export type { WorkflowRun, Message } from '@/lib/api/workflow-runs'

export interface ChatAttachment {
  id: string
  url: string
  filename: string
  mimeType: string
  source: 'user' | 'agent'
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  type: string
  content: string
  data?: Record<string, unknown>
  attachments?: ChatAttachment[]
  timestamp: string
  isStreaming?: boolean
}

export type GroupedItem =
  | { type: 'thinking'; thoughts: string[]; isLive: boolean; key: string }
  | { type: 'messages'; messages: ChatMessage[]; role: 'user' | 'assistant'; key: string }
  | { type: 'clarification'; message: ChatMessage; key: string }

import type { NavHint } from './nav-chips'

export interface TextOutput {
  type: 'text'
  response: string
}

export interface NavHintsOutput {
  type: 'nav_hints'
  response: string
  hints: NavHint[]
}

export type WorkflowOutput = TextOutput | NavHintsOutput

export function extractContent(output: unknown): string | null {
  if (!output || typeof output !== 'object') return null
  return (output as Record<string, unknown>).response as string ?? null
}

export function extractNavHints(output: unknown): NavHint[] | undefined {
  if (!output || typeof output !== 'object') return undefined
  const obj = output as Record<string, unknown>
  if (obj.type === 'nav_hints') {
    const hints = obj.hints
    return Array.isArray(hints) ? hints : undefined
  }
  const legacy = obj.nav_hints ?? obj.hints
  return Array.isArray(legacy) ? legacy : undefined
}
