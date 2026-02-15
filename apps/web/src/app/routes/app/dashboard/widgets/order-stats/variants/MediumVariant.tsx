import { ShoppingCart, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { useOrderStatsContext } from '../context'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
}

export function MediumVariant() {
  const { totalOrders, pendingOrders, completedOrders, canceledOrders, totalRevenue, currency } = useOrderStatsContext()

  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Orders Overview</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span>{completionRate}% completion</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-xl font-bold">{formatCurrency(totalRevenue, currency)}</p>
        </div>
        <div className="space-y-1 p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground">Total Orders</p>
          <p className="text-xl font-bold">{totalOrders}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30">
          <Clock className="h-4 w-4 text-amber-500" />
          <div>
            <p className="text-sm font-semibold">{pendingOrders}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-sm font-semibold">{completedOrders}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/30">
          <XCircle className="h-4 w-4 text-red-500" />
          <div>
            <p className="text-sm font-semibold">{canceledOrders}</p>
            <p className="text-xs text-muted-foreground">Canceled</p>
          </div>
        </div>
      </div>
    </div>
  )
}
