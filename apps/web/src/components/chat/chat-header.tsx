import { X, Plus, History, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatHeaderProps {
  isConnected: boolean
  isLoading: boolean
  onShowHistory: () => void
  onNew: () => void
  onClose: () => void
}

export function ChatHeader({
  isConnected,
  isLoading,
  onShowHistory,
  onNew,
  onClose,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b bg-muted/50">
      <div className="flex items-center gap-2">
        <img src="/end-of-szn-logo.png" alt="Eugene" className="size-5" />
        <span className="font-medium text-sm">Eugene</span>
        {!isConnected && <span className="text-xs text-muted-foreground">(connecting...)</span>}
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onShowHistory}
          title="History"
        >
          <History className="size-4" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onNew}
          disabled={isLoading}
          title="New conversation"
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
