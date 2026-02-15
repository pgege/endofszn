import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface ActionButtonProps {
  icon: LucideIcon
  label: string
  href: string
  className?: string
}

export function ActionButton({ icon: Icon, label, href, className }: ActionButtonProps) {
  return (
    <Link
      to={href}
      className={cn(
        'flex flex-col items-center gap-2 p-4 border bg-background/50 hover:bg-muted/50 transition-colors',
        className,
      )}
    >
      <div className="h-9 w-9 flex items-center justify-center bg-primary/10">
        <Icon className="h-4.5 w-4.5 text-primary" />
      </div>
      <span className="text-xs font-medium text-center">{label}</span>
    </Link>
  )
}
