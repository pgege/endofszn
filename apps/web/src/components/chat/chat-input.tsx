import { useRef, useCallback, useState, type ReactNode } from 'react'
import { ArrowUp, Square, Loader2, ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadFile } from '@/lib/upload'
import type { ChatAttachment } from './types'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (attachments?: ChatAttachment[]) => void
  onCancel?: () => void
  isDisabled: boolean
  isProcessing: boolean
  placeholder?: string
  toolbarLeft?: ReactNode
}

export function ChatInput({ value, onChange, onSend, onCancel, isDisabled, isProcessing, placeholder, toolbarLeft }: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const handleSend = useCallback(() => {
    onSend(attachments.length > 0 ? attachments : undefined)
    setAttachments([])
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [onSend, attachments])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    try {
      const uploaded = await Promise.all(Array.from(files).map(uploadFile))
      setAttachments((prev) => [...prev, ...uploaded])
    } catch (e) {
      console.error('Upload failed:', e)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect]
  )

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const canSend = (value.trim() || attachments.length > 0) && !isProcessing

  return (
    <div className="shrink-0 p-3">
      <div
        className="border bg-muted/30 focus-within:ring-1 focus-within:ring-ring transition-shadow"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-3">
            {attachments.map((att) => (
              <div key={att.id} className="relative group">
                {att.mimeType.startsWith('image/') ? (
                  <img
                    src={att.url}
                    alt={att.filename}
                    className="h-14 w-14 object-cover border"
                  />
                ) : (
                  <div className="h-14 w-14 border flex items-center justify-center bg-muted text-[10px] text-center px-1">
                    {att.filename}
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Type a message...'}
          className="w-full resize-none bg-transparent px-3 pt-3 pb-1 text-sm placeholder:text-muted-foreground focus:outline-none"
          rows={2}
          disabled={isDisabled}
        />

        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-1">
            {toolbarLeft}
          </div>
          <div className="flex items-center gap-1">
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
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDisabled || isUploading}
            >
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImageIcon className="size-4" />
              )}
            </Button>
            <Button
              size="icon"
              className="h-7 w-7"
              onClick={isProcessing ? onCancel : handleSend}
              disabled={isProcessing ? false : !canSend}
            >
              {isProcessing ? (
                <Square className="size-3" />
              ) : (
                <ArrowUp className="size-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
