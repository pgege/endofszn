import { ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useOrderStatsContext } from '../context'

export function SmallVariant() {
  const { totalOrders, pendingOrders, completedOrders, canceledOrders } = useOrderStatsContext()

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Order Summary</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-2xl font-bold">{totalOrders}</p>
          <p className="text-xs text-muted-foreground">Total Orders</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-500" />
            <p className="text-lg font-semibold">{pendingOrders}</p>
          </div>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <p className="text-lg font-semibold">{completedOrders}</p>
          </div>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-500" />
            <p className="text-lg font-semibold">{canceledOrders}</p>
          </div>
          <p className="text-xs text-muted-foreground">Canceled</p>
        </div>
      </div>
    </div>
  )
}
