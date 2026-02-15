import { type LucideIcon, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AlertRowProps {
  icon?: LucideIcon
  label: string
  count: number
  variant?: 'warning' | 'error' | 'info'
  ctaLabel?: string
  ctaHref?: string
}

const variantStyles = {
  warning: 'border-amber-500/20 bg-amber-500/5',
  error: 'border-red-500/20 bg-red-500/5',
  info: 'border-blue-500/20 bg-blue-500/5',
}

const iconStyles = {
  warning: 'text-amber-500',
  error: 'text-red-500',
  info: 'text-blue-500',
}

export function AlertRow({
  icon: Icon = AlertTriangle,
  label,
  count,
  variant = 'warning',
  ctaLabel,
  ctaHref,
}: AlertRowProps) {
  return (
    <div className={cn('flex items-center gap-3 p-3 border', variantStyles[variant])}>
      <Icon className={cn('h-4 w-4 shrink-0', iconStyles[variant])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{label}</p>
        <p className="text-xs text-muted-foreground">{count} item{count !== 1 ? 's' : ''}</p>
      </div>
      {ctaLabel && ctaHref && (
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link to={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  )
}
