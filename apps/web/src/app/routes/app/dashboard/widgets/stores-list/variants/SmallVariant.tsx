import { Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/config/paths'
import { useStoresListContext } from '../context'

export function SmallVariant() {
  const { stores } = useStoresListContext()

  return (
    <div className="h-full flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Store className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{stores.length} store{stores.length !== 1 ? 's' : ''}</span>
      </div>
      <Link to={paths.app.stores.list.getHref()} className="text-xs text-primary hover:underline">
        View All
      </Link>
    </div>
  )
}
