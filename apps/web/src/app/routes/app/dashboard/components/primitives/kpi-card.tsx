import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: number | string
  annotation?: string
  trend?: 'up' | 'down' | 'flat'
  icon?: LucideIcon
  href?: string
}

const trendConfig = {
  up: { icon: TrendingUp, color: 'text-green-500' },
  down: { icon: TrendingDown, color: 'text-red-500' },
  flat: { icon: Minus, color: 'text-muted-foreground' },
}

export function KpiCard({ label, value, annotation, trend, icon: Icon, href }: KpiCardProps) {
  const content = (
    <div className={cn(
      'flex items-center justify-between gap-3 p-3 border bg-background/50',
      href && 'hover:bg-muted/50 transition-colors cursor-pointer',
    )}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="h-8 w-8 shrink-0 flex items-center justify-center bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-semibold leading-tight">{value}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        {trend && (() => {
          const { icon: TrendIcon, color } = trendConfig[trend]
          return <TrendIcon className={cn('h-3.5 w-3.5', color)} />
        })()}
        {annotation && <span className="text-[10px] text-muted-foreground">{annotation}</span>}
      </div>
    </div>
  )

  if (href) {
    return <Link to={href}>{content}</Link>
  }

  return content
}
