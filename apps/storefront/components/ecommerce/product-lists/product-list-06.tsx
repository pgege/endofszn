import { cn } from "@/lib/utils"
import type { EcommerceProduct } from "../types"

interface ProductList06Props {
  title?: string
  products: EcommerceProduct[]
  className?: string
}

export function ProductList06({ title, products, className }: ProductList06Props) {
  return (
    <div data-slot="product-list" className={cn("bg-background", className)}>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        {title && (
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        )}
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {products.map((product) => (
            <a key={product.id} href={product.href} className="group">
              <img
                src={product.imageSrc}
                alt={product.imageAlt}
                className="aspect-square w-full rounded-lg bg-muted object-cover group-hover:opacity-75"
              />
              <h3 className="mt-4 text-sm text-foreground">{product.name}</h3>
              <p className="mt-1 text-lg font-medium text-foreground">{product.price}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
