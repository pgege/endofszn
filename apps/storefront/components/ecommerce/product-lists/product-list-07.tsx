import { cn } from "@/lib/utils"
import type { EcommerceProduct } from "../types"

interface ProductList07Props {
  title?: string
  ctaText?: string
  ctaHref?: string
  products: EcommerceProduct[]
  className?: string
}

export function ProductList07({
  title,
  ctaText = "Browse all favorites",
  ctaHref = "#",
  products,
  className,
}: ProductList07Props) {
  return (
    <div data-slot="product-list" className={cn("bg-background", className)}>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          {title && (
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
          )}
          <a
            href={ctaHref}
            className="hidden text-sm font-medium text-primary hover:text-primary/80 md:block"
          >
            {ctaText}
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-4 md:gap-y-0 lg:gap-x-8">
          {products.map((product) => (
            <div key={product.id} className="group relative">
              <div className="h-56 w-full overflow-hidden rounded-md bg-muted group-hover:opacity-75 lg:h-72 xl:h-80">
                <img
                  src={product.imageSrc}
                  alt={product.imageAlt}
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mt-4 text-sm text-foreground">
                <a href={product.href}>
                  <span className="absolute inset-0" />
                  {product.name}
                </a>
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{product.color}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{product.price}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-sm md:hidden">
          <a href={ctaHref} className="font-medium text-primary hover:text-primary/80">
            {ctaText}
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </div>
      </div>
    </div>
  )
}
