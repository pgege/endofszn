import { Link } from 'react-router-dom'
import { Store as StoreIcon, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { paths } from '@/config/paths'
import type { Store } from '@/lib/api/auth'

function nameToHue(name: string) {
  return name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
}

export function StoreCard({ store }: { store: Store }) {
  const hue = nameToHue(store.name)

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <div
        className="h-16 flex items-end px-4 pb-2"
        style={{
          background: `linear-gradient(135deg, hsl(${hue}, 55%, 50%), hsl(${(hue + 50) % 360}, 50%, 40%))`,
        }}
      >
        <div className="flex items-center gap-2">
          {store.profile?.logoUrl ? (
            <img
              src={store.profile.logoUrl}
              alt={store.name}
              className="h-8 w-8 object-cover border border-white/30"
            />
          ) : (
            <div className="h-8 w-8 bg-white/20 backdrop-blur flex items-center justify-center">
              <StoreIcon className="h-4 w-4 text-white" />
            </div>
          )}
          <span className="text-sm font-semibold text-white truncate">{store.name}</span>
        </div>
      </div>
      <CardContent className="pt-3">
        <div className="flex items-center justify-between mb-2">
          {store.profile?.isPublished ? (
            <span className="text-xs text-green-600 font-medium">Published</span>
          ) : (
            <span className="text-xs text-muted-foreground">Draft</span>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
            <Link to={paths.app.stores.settings.getHref(store.id)}>
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <CardDescription className="line-clamp-2 min-h-10">
          {store.profile?.description || 'No description'}
        </CardDescription>
        <div className="mt-3">
          <Button variant="outline" className="w-full" size="sm" asChild>
            <Link to={paths.app.stores.detail.getHref(store.id)}>
              Manage Store
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
