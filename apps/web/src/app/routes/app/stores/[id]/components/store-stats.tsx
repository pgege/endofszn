import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  count: number
  icon: LucideIcon
  emptyText: string
  linkTo?: string
}

export function StatCard({ title, count, icon: Icon, emptyText, linkTo }: StatCardProps) {
  const content = (
    <Card className={linkTo ? "hover:bg-muted/50 transition-colors cursor-pointer" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-lg font-semibold">{count}</div>
        <p className="text-xs text-muted-foreground">{count > 0 ? 'Click to manage' : emptyText}</p>
      </CardContent>
    </Card>
  )

  return linkTo ? <Link to={linkTo}>{content}</Link> : content
}
