import { cn } from "@/lib/utils"
import type { EcommerceProduct } from "../types"

interface ProductList09Props {
  title?: string
  products: EcommerceProduct[]
  className?: string
}

export function ProductList09({ title, products, className }: ProductList09Props) {
  return (
    <div data-slot="product-list" className={cn("bg-background", className)}>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        {title && (
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        )}
        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="group relative">
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <img
                  src={product.imageSrc}
                  alt={product.imageAlt}
                  className="h-full w-full object-cover group-hover:opacity-75"
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-base font-medium text-foreground">
                <h3>
                  <a href={product.href}>
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.name}
                  </a>
                </h3>
                <p>{product.price}</p>
              </div>
              {product.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {product.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
