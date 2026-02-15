import { useState, useCallback, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const OTHER_PREFIX = 'other:'

export interface ClarificationOption {
  id: string
  label: string
}

export interface ClarificationQuestion {
  id: string
  prompt: string
  options: ClarificationOption[]
  allow_multiple?: boolean
}

export interface ClarificationState {
  active: boolean
  callbackId: string
  workflowRunId: string
  context: string
  questions: ClarificationQuestion[]
}

interface ClarificationPanelProps {
  state: ClarificationState
  onSubmit: (answers: Record<string, string | string[]>) => void
}

export function ClarificationPanel({ state, onSubmit }: ClarificationPanelProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [otherText, setOtherText] = useState<Record<string, string>>({})
  const otherInputRef = useRef<HTMLInputElement>(null)

  const totalPages = state.questions.length
  const isLastPage = currentPage === totalPages - 1
  const currentQuestion = state.questions[currentPage]

  const isOtherActive = useCallback((questionId: string) => {
    const val = answers[questionId]
    if (Array.isArray(val)) return val.some((v) => v.startsWith(OTHER_PREFIX))
    return typeof val === 'string' && val.startsWith(OTHER_PREFIX)
  }, [answers])

  const handleSelect = useCallback((questionId: string, optionId: string, allowMultiple: boolean) => {
    setAnswers((prev) => {
      if (allowMultiple) {
        const current = (prev[questionId] as string[]) || []
        const updated = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId]
        return { ...prev, [questionId]: updated }
      }
      return { ...prev, [questionId]: optionId }
    })
  }, [])

  const handleOtherToggle = useCallback((questionId: string, allowMultiple: boolean) => {
    const text = otherText[questionId] || ''
    const otherValue = `${OTHER_PREFIX}${text}`

    setAnswers((prev) => {
      if (allowMultiple) {
        const current = (prev[questionId] as string[]) || []
        const hasOther = current.some((v) => v.startsWith(OTHER_PREFIX))
        if (hasOther) {
          return { ...prev, [questionId]: current.filter((v) => !v.startsWith(OTHER_PREFIX)) }
        }
        return { ...prev, [questionId]: [...current, otherValue] }
      }
      const currentVal = prev[questionId]
      if (typeof currentVal === 'string' && currentVal.startsWith(OTHER_PREFIX)) {
        const { [questionId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [questionId]: otherValue }
    })
  }, [otherText])

  const handleOtherTextChange = useCallback((questionId: string, text: string, allowMultiple: boolean) => {
    setOtherText((prev) => ({ ...prev, [questionId]: text }))
    const otherValue = `${OTHER_PREFIX}${text}`

    setAnswers((prev) => {
      if (allowMultiple) {
        const current = (prev[questionId] as string[]) || []
        const hasOther = current.some((v) => v.startsWith(OTHER_PREFIX))
        if (hasOther) {
          return { ...prev, [questionId]: current.map((v) => v.startsWith(OTHER_PREFIX) ? otherValue : v) }
        }
        return { ...prev, [questionId]: [...current, otherValue] }
      }
      return { ...prev, [questionId]: otherValue }
    })
  }, [])

  const isSelected = useCallback((questionId: string, optionId: string) => {
    const val = answers[questionId]
    if (Array.isArray(val)) return val.includes(optionId)
    return val === optionId
  }, [answers])

  useEffect(() => {
    if (isOtherActive(currentQuestion?.id) && otherInputRef.current) {
      otherInputRef.current.focus()
    }
  }, [currentPage, currentQuestion?.id, isOtherActive])

  const handleSubmit = useCallback(() => {
    onSubmit(answers)
    setCurrentPage(0)
    setAnswers({})
    setOtherText({})
  }, [answers, onSubmit])

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (isLastPage) {
      handleSubmit()
    } else {
      setCurrentPage((p) => p + 1)
    }
  }, [isLastPage, handleSubmit])

  if (!currentQuestion) return null

  const otherActive = isOtherActive(currentQuestion.id)

  return (
    <form onSubmit={handleFormSubmit} className="shrink-0 border-t bg-muted/20 animate-in slide-in-from-bottom-2 duration-200">
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span className="font-medium">{state.context || 'Quick question'}</span>
          <span>({currentPage + 1}/{totalPages})</span>
        </div>

        <p className="text-sm font-medium mb-3">{currentQuestion.prompt}</p>

        <div className="space-y-1.5 mb-3">
          {currentQuestion.options.map((opt) => {
            const selected = isSelected(currentQuestion.id, opt.id)
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(currentQuestion.id, opt.id, !!currentQuestion.allow_multiple)}
                className={`w-full text-left text-sm px-3 py-2 border transition-colors ${
                  selected
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-background hover:bg-muted/50 text-foreground'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span className={`inline-block size-4 border-2 shrink-0 ${
                    selected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                  }`}>
                    {selected && (
                      <svg className="size-4 text-primary-foreground" viewBox="0 0 16 16" fill="none">
                        <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {opt.label}
                </span>
              </button>
            )
          })}

          <button
            onClick={() => handleOtherToggle(currentQuestion.id, !!currentQuestion.allow_multiple)}
            className={`w-full text-left text-sm px-3 py-2 border transition-colors ${
              otherActive
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-background hover:bg-muted/50 text-foreground'
            }`}
          >
            <span className="inline-flex items-center gap-2 w-full">
              <span className={`inline-block size-4 border-2 shrink-0 ${
                otherActive ? 'border-primary bg-primary' : 'border-muted-foreground/40'
              }`}>
                {otherActive && (
                  <svg className="size-4 text-primary-foreground" viewBox="0 0 16 16" fill="none">
                    <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <input
                ref={otherInputRef}
                type="text"
                value={otherText[currentQuestion.id] || ''}
                onChange={(e) => handleOtherTextChange(currentQuestion.id, e.target.value, !!currentQuestion.allow_multiple)}
                onFocus={() => {
                  if (!otherActive) handleOtherToggle(currentQuestion.id, !!currentQuestion.allow_multiple)
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Other..."
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60 min-w-0"
              />
            </span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentPage((p) => p - 1)}
          disabled={currentPage === 0}
          className="gap-1 text-xs"
        >
          <ChevronLeft className="size-3.5" />
          Back
        </Button>

        {isLastPage ? (
          <Button
            type="submit"
            size="sm"
            className="gap-1 text-xs"
          >
            Submit
            <Send className="size-3.5" />
          </Button>
        ) : (
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="gap-1 text-xs"
          >
            Next
            <ChevronRight className="size-3.5" />
          </Button>
        )}
      </div>
    </form>
  )
}
