import { TrendingUp } from 'lucide-react'
import { useRevenueContext } from '../context'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100)
}

export function SmallVariant() {
  const { totalRevenue, totalOrders, currency } = useRevenueContext()

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Revenue</span>
      </div>
      <div>
        <p className="text-2xl font-bold">{formatCurrency(totalRevenue, currency)}</p>
        <p className="text-xs text-muted-foreground">{totalOrders} orders total</p>
      </div>
    </div>
  )
}
