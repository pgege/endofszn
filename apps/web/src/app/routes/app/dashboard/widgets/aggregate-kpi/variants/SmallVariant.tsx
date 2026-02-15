import { Store, Package } from 'lucide-react'
import { useAggregateKpiContext } from '../context'

export function SmallVariant() {
  const { totalStores, totalProducts } = useAggregateKpiContext()

  return (
    <div className="h-full flex items-center gap-6">
      <div className="flex items-center gap-2">
        <Store className="h-4 w-4 text-primary" />
        <div>
          <p className="text-lg font-semibold leading-none">{totalStores}</p>
          <p className="text-[10px] text-muted-foreground">Stores</p>
        </div>
      </div>
      <div className="h-6 w-px bg-border" />
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-primary" />
        <div>
          <p className="text-lg font-semibold leading-none">{totalProducts}</p>
          <p className="text-[10px] text-muted-foreground">Products</p>
        </div>
      </div>
    </div>
  )
}
