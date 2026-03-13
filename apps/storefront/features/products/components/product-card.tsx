import type { Product } from '@/lib/storefront'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import Image from 'next/image'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square relative bg-muted">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium truncate">{product.title}</h3>
        {product.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {product.description}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <span className="font-semibold">{product.price}</span>
      </CardFooter>
    </Card>
  )
}
