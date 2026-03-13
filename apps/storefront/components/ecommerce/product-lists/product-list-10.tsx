import { cn } from "@/lib/utils"
import type { EcommerceProduct } from "../types"

interface ProductList10Props {
  title?: string
  ctaText?: string
  ctaHref?: string
  products: EcommerceProduct[]
  className?: string
}

export function ProductList10({
  title,
  ctaText = "Shop the collection",
  ctaHref = "#",
  products,
  className,
}: ProductList10Props) {
  return (
    <div data-slot="product-list" className={cn("bg-background", className)}>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="flex items-center justify-between">
          {title && (
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
          )}
          <a
            href={ctaHref}
            className="text-sm font-semibold text-primary hover:text-primary/80"
          >
            {ctaText}
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {products.map((product) => (
            <div key={product.id} className="group relative">
              <img
                src={product.imageSrc}
                alt={product.imageAlt}
                className="aspect-square w-full rounded-md bg-muted object-cover group-hover:opacity-75"
              />
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm text-foreground">
                    <a href={product.href}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </a>
                  </h3>
                  {product.color && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {product.color}
                    </p>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
