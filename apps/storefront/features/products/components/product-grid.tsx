import type { Product } from '@/lib/storefront'
import { ProductCard } from './product-card'
import Link from 'next/link'

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No products available yet.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link key={product.id} href={`/products/${product.handle}`}>
          <ProductCard product={product} />
        </Link>
      ))}
    </div>
  )
}
