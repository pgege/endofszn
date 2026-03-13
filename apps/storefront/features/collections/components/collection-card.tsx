import type { Collection } from '@/lib/storefront'
import { Card, CardContent } from '@/components/ui/card'

interface CollectionCardProps {
  collection: Collection
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <h3 className="font-medium text-lg">{collection.title}</h3>
        {collection.products && (
          <p className="text-sm text-muted-foreground mt-1">
            {collection.products.length} product{collection.products.length !== 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
