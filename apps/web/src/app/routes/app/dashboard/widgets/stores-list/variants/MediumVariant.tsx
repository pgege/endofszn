import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { paths } from '@/config/paths'
import { useStoresListContext } from '../context'

export function MediumVariant() {
  const { stores } = useStoresListContext()

  return (
    <div className="h-full overflow-auto -mx-1 px-1 space-y-1">
      {stores.map((store) => (
        <Link
          key={store.id}
          to={paths.app.stores.detail.getHref(store.id)}
          className="flex items-center gap-2 p-2 hover:bg-muted/30 transition-colors group"
        >
          <span className="text-sm font-medium flex-1 truncate">{store.name}</span>
          <Badge variant={store.profile?.isPublished ? 'default' : 'secondary'} className="text-[10px]">
            {store.profile?.isPublished ? 'Published' : 'Draft'}
          </Badge>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </Link>
      ))}
    </div>
  )
}
