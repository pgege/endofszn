import { Link } from 'react-router-dom'
import { Package, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { paths } from '@/config/paths'
import { useStoreId } from '../../store-context'
import type { Product } from '@/lib/api/products'
import { useState } from 'react'

const MAX_THUMBNAILS = 4

export function ProductCard({
  product,
  onDelete,
}: {
  product: Product
  onDelete: () => void
}) {
  const storeId = useStoreId()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const images = product.images ?? []
  const displayUrl = images[selectedImageIndex]?.url ?? product.thumbnail
  const overflowCount = images.length > MAX_THUMBNAILS ? images.length - MAX_THUMBNAILS : 0

  return (
    <div className="group relative border shadow-md hover:shadow-lg transition-shadow bg-card overflow-hidden">
      <Link to={paths.app.stores.products.detail.getHref(storeId, product.id)}>
        <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '1 / 1' }}>
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={product.title}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
      </Link>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 dark:bg-black/50 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-black/60">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={paths.app.stores.products.detail.getHref(storeId, product.id)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {images.length > 1 && (
        <div className="flex items-center gap-1.5 px-3 py-2">
          {images.slice(0, MAX_THUMBNAILS).map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelectedImageIndex(i)}
              className={`h-10 w-10 overflow-hidden shrink-0 transition-all ${
                i === selectedImageIndex
                  ? 'ring-2 ring-primary opacity-100'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
          {overflowCount > 0 && (
            <span className="text-xs text-muted-foreground font-medium pl-1">
              +{overflowCount}
            </span>
          )}
        </div>
      )}

      <div className="px-3 pt-2 pb-3">
        <Link
          to={paths.app.stores.products.detail.getHref(storeId, product.id)}
          className="font-medium hover:underline line-clamp-1 text-sm"
        >
          {product.title}
        </Link>
        <div className="flex items-center justify-between mt-1">
          {product.variants && product.variants.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
            </p>
          )}
          <Badge variant={product.status === 'published' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
            {product.status}
          </Badge>
        </div>
      </div>
    </div>
  )
}
