import { TrendingUp } from 'lucide-react'
import { useRevenueContext } from '../context'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100)
}

export function MediumVariant() {
  const { monthly, totalRevenue, currency } = useRevenueContext()

  const maxRevenue = Math.max(...monthly.map((m) => m.revenue), 1)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Revenue (6 months)</span>
        </div>
        <span className="text-sm font-bold">{formatCurrency(totalRevenue, currency)}</span>
      </div>

      <div className="flex items-end gap-2 h-32">
        {monthly.map((m) => {
          const height = Math.max((m.revenue / maxRevenue) * 100, 4)
          return (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center justify-end h-24">
                <div
                  className="w-full bg-primary/20 hover:bg-primary/40 transition-colors"
                  style={{ height: `${height}%` }}
                  title={`${m.label}: ${formatCurrency(m.revenue, currency)} (${m.orders} orders)`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{m.label}</span>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {monthly.slice(-3).map((m) => (
          <div key={m.month} className="p-2 bg-muted/30">
            <p className="text-xs font-medium">{formatCurrency(m.revenue, currency)}</p>
            <p className="text-[10px] text-muted-foreground">{m.label} ({m.orders})</p>
          </div>
        ))}
      </div>
    </div>
  )
}
