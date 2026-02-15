import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, MessageSquareMore, HelpCircle } from 'lucide-react'
import type { ChatMessage } from './types'
import type { ClarificationQuestion } from './clarification-panel'
import { OTHER_PREFIX } from './clarification-panel'

interface ClarificationSummaryProps {
  message: ChatMessage
}

export function ClarificationSummary({ message }: ClarificationSummaryProps) {
  const [expanded, setExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)

  const isRequest = message.type === 'workflow:clarification'

  const data = message.data as {
    context?: string
    questions: ClarificationQuestion[]
    answers?: Record<string, string | string[]>
  } | undefined

  if (!data?.questions?.length) return null

  const { questions, answers, context } = data
  const totalPages = questions.length
  const currentQuestion = questions[currentPage]

  if (isRequest) {
    return (
      <div className="mx-auto max-w-full overflow-hidden">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center gap-2 px-3 py-2 border border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/30 transition-colors text-left min-w-0"
        >
          <HelpCircle className="size-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-xs text-muted-foreground/60 flex-1 truncate min-w-0">
            {context || 'Clarification'} &middot; {questions.length} question{questions.length !== 1 ? 's' : ''} &middot; awaiting response
          </span>
          <ChevronDown className={`size-3.5 text-muted-foreground/60 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="mt-2 border border-dashed border-muted-foreground/20 bg-background overflow-hidden animate-in slide-in-from-top-1 duration-150">
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-1 hover:bg-muted disabled:opacity-30 disabled:cursor-default transition-colors"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="p-1 hover:bg-muted disabled:opacity-30 disabled:cursor-default transition-colors"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>

              <p className="text-xs font-medium text-foreground/70 mb-2">{currentQuestion.prompt}</p>

              <div className="space-y-1">
                {currentQuestion.options.map((opt) => (
                  <div
                    key={opt.id}
                    className="text-xs px-2.5 py-1.5 border border-transparent text-muted-foreground"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block size-3 border border-muted-foreground/30 shrink-0" />
                      {opt.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const getAnswerDisplay = (question: ClarificationQuestion) => {
    if (!answers) return { selectedLabels: [], otherText: null }
    const selected = answers[question.id]
    const ids = Array.isArray(selected) ? selected : selected ? [selected] : []
    const predefined = ids.filter((id) => !id.startsWith(OTHER_PREFIX))
    const otherEntry = ids.find((id) => id.startsWith(OTHER_PREFIX))
    const otherText = otherEntry ? otherEntry.slice(OTHER_PREFIX.length) : null
    const selectedLabels = question.options.filter((o) => predefined.includes(o.id)).map((o) => o.label)
    return { selectedLabels, otherText }
  }

  const answeredCount = answers
    ? questions.filter((q) => {
        const sel = answers[q.id]
        return sel && (Array.isArray(sel) ? sel.length > 0 : true)
      }).length
    : 0

  const { selectedLabels, otherText } = getAnswerDisplay(currentQuestion)

  return (
    <div className="mx-auto max-w-full overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-3 py-2 border bg-muted/30 hover:bg-muted/50 transition-colors text-left min-w-0"
      >
        <MessageSquareMore className="size-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground flex-1 truncate min-w-0">
          {context || 'Clarification'} &middot; {answeredCount}/{questions.length} answered
        </span>
        <ChevronDown className={`size-3.5 text-muted-foreground shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-2 border bg-background overflow-hidden animate-in slide-in-from-top-1 duration-150">
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="p-1 hover:bg-muted disabled:opacity-30 disabled:cursor-default transition-colors"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="text-[11px] text-muted-foreground font-medium">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="p-1 hover:bg-muted disabled:opacity-30 disabled:cursor-default transition-colors"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            <p className="text-xs font-medium text-foreground mb-2">{currentQuestion.prompt}</p>

            <div className="space-y-1">
              {currentQuestion.options.map((opt) => {
                const selected = selectedLabels.includes(opt.label)
                return (
                  <div
                    key={opt.id}
                    className={`text-xs px-2.5 py-1.5 border ${
                      selected
                        ? 'border-primary/40 bg-primary/8 text-foreground font-medium'
                        : 'border-transparent text-muted-foreground'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {selected ? (
                        <span className="inline-block size-3 bg-primary shrink-0">
                          <svg className="size-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                            <path d="M3 6l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-block size-3 border border-muted-foreground/30 shrink-0" />
                      )}
                      {opt.label}
                    </span>
                  </div>
                )
              })}

              {otherText && (
                <div className="text-xs px-2.5 py-1.5 border border-primary/40 bg-primary/8 text-foreground font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-3 bg-primary shrink-0">
                      <svg className="size-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                        <path d="M3 6l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    Other: {otherText}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
