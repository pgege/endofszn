import { cn } from "@/lib/utils"
import type { EcommerceProduct } from "../types"

interface ProductList08Props {
  title?: string
  products: EcommerceProduct[]
  className?: string
}

export function ProductList08({ title, products, className }: ProductList08Props) {
  return (
    <div data-slot="product-list" className={cn("bg-background", className)}>
      <div className="mx-auto max-w-7xl overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {title && (
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        )}
        <div className="mt-8 -mx-px grid grid-cols-2 border-l border-border sm:mx-0 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative border-b border-r border-border p-4 sm:p-6"
            >
              <img
                src={product.imageSrc}
                alt={product.imageAlt}
                className="aspect-square w-full rounded-lg bg-muted object-cover group-hover:opacity-75"
              />
              <div className="pb-4 pt-10 text-center">
                <h3 className="text-sm font-medium text-foreground">
                  <a href={product.href}>
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.name}
                  </a>
                </h3>
                {product.color && (
                  <p className="mt-1 text-sm text-muted-foreground">{product.color}</p>
                )}
                <p className="mt-4 text-base font-medium text-foreground">
                  {product.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
