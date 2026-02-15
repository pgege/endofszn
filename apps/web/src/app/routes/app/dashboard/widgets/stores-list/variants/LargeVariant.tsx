import { StoreCard } from '@/app/routes/app/components/store-card'
import { useStoresListContext } from '../context'

export function LargeVariant() {
  const { stores } = useStoresListContext()

  return (
    <div className="grid grid-cols-2 gap-4 h-full overflow-auto">
      {stores.map((store) => (
        <StoreCard key={store.id} store={store} />
      ))}
    </div>
  )
}
