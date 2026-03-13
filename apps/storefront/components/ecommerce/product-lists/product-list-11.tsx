import { StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EcommerceProduct } from "../types"

interface ProductList11Props {
  title?: string
  products: EcommerceProduct[]
  className?: string
}

export function ProductList11({ title, products, className }: ProductList11Props) {
  return (
    <div data-slot="product-list" className={cn("bg-background", className)}>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        {title && (
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        )}
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {products.map((product) => (
            <div key={product.id} className="group relative rounded-lg border border-border p-4">
              <img
                src={product.imageSrc}
                alt={product.imageAlt}
                className="aspect-square w-full rounded-md bg-muted object-cover group-hover:opacity-75"
              />
              <div className="mt-4">
                <h3 className="text-sm font-medium text-foreground">
                  <a href={product.href}>
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.name}
                  </a>
                </h3>
                {product.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}
                {product.rating !== undefined && (
                  <div className="mt-2 flex items-center">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <StarIcon
                        key={star}
                        className={cn(
                          "h-4 w-4 shrink-0",
                          (product.rating ?? 0) > star
                            ? "fill-primary text-primary"
                            : "fill-muted text-muted"
                        )}
                      />
                    ))}
                    {product.reviewCount !== undefined && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({product.reviewCount})
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{product.price}</p>
                  {product.originalPrice && (
                    <p className="text-sm text-muted-foreground line-through">
                      {product.originalPrice}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
