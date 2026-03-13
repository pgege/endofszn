import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { EcommerceProduct } from "../types"

interface ProductList05Props {
  title?: string
  products: EcommerceProduct[]
  onAddToCart?: (productId: string) => void
  className?: string
}

export function ProductList05({
  title,
  products,
  onAddToCart,
  className,
}: ProductList05Props) {
  return (
    <div data-slot="product-list" className={cn("bg-background", className)}>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        {title && (
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        )}
        <div className="mt-8 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
          {products.map((product) => (
            <div key={product.id}>
              <div className="group relative">
                <div className="relative h-72 w-full overflow-hidden rounded-lg">
                  <img
                    src={product.imageSrc}
                    alt={product.imageAlt}
                    className="h-full w-full object-cover group-hover:opacity-75"
                  />
                </div>
                <div className="relative mt-4">
                  <h3 className="text-sm font-medium text-foreground">
                    {product.name}
                  </h3>
                  {product.color && (
                    <p className="mt-1 text-sm text-muted-foreground">{product.color}</p>
                  )}
                </div>
                <div className="absolute inset-x-0 top-0 flex h-72 items-end justify-end overflow-hidden rounded-lg p-4">
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/60"
                  />
                  <p className="relative text-lg font-semibold text-white">
                    {product.price}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Button
                  onClick={() => onAddToCart?.(product.id)}
                  className="w-full"
                >
                  Add to bag
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
