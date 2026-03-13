"use client"

import { useState } from "react"
import { StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { EcommerceColor, EcommerceSize } from "../types"

interface ProductOverview03Props {
  product: {
    name: string
    price: string
    rating?: number
    reviewCount?: number
    imageSrc: string
    imageAlt: string
    description?: string
    colors?: EcommerceColor[]
    sizes?: EcommerceSize[]
    href?: string
  }
  selectedColor?: string
  selectedSize?: string
  onColorChange?: (color: string) => void
  onSizeChange?: (size: string) => void
  onAddToCart?: () => void
  className?: string
}

export function ProductOverview03({
  product,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
  onAddToCart,
  className,
}: ProductOverview03Props) {
  const [internalColor, setInternalColor] = useState(
    selectedColor ?? product.colors?.[0]?.name ?? ""
  )
  const [internalSize, setInternalSize] = useState(
    selectedSize ?? product.sizes?.find((s) => s.inStock)?.name ?? ""
  )

  const currentColor = selectedColor ?? internalColor
  const currentSize = selectedSize ?? internalSize

  const handleColorChange = (color: string) => {
    setInternalColor(color)
    onColorChange?.(color)
  }

  const handleSizeChange = (size: string) => {
    setInternalSize(size)
    onSizeChange?.(size)
  }

  return (
    <div
      data-slot="product-overview"
      className={cn("bg-background", className)}
    >
      <div className="mx-auto max-w-2xl lg:max-w-none lg:grid lg:grid-cols-2 lg:gap-x-0">
        <div className="aspect-square overflow-hidden lg:aspect-auto lg:h-full">
          <img
            src={product.imageSrc}
            alt={product.imageAlt}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-center px-4 py-16 sm:px-6 lg:px-12 xl:px-16">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-center">
            <p className="text-2xl tracking-tight text-foreground">{product.price}</p>

            {product.rating !== undefined && (
              <div className="ml-4 flex items-center border-l border-border pl-4">
                <div className="flex items-center">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <StarIcon
                      key={star}
                      className={cn(
                        "h-5 w-5 shrink-0",
                        (product.rating ?? 0) > star
                          ? "fill-primary text-primary"
                          : "fill-muted text-muted"
                      )}
                    />
                  ))}
                </div>
                {product.reviewCount !== undefined && (
                  <p className="ml-2 text-sm text-muted-foreground">
                    {product.reviewCount} reviews
                  </p>
                )}
              </div>
            )}
          </div>

          {product.description && (
            <p className="mt-6 text-base text-muted-foreground">
              {product.description}
            </p>
          )}

          <div className="mt-8">
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground">Color</h3>
                <div className="mt-3 flex items-center gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      aria-label={color.name}
                      onClick={() => handleColorChange(color.name)}
                      className={cn(
                        "relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 focus:outline-none",
                        currentColor === color.name
                          ? "ring-2 ring-ring ring-offset-2 ring-offset-background"
                          : ""
                      )}
                    >
                      <span
                        className="h-8 w-8 rounded-full border border-border/30"
                        style={{ backgroundColor: color.value }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-foreground">Size</h3>
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size.name}
                      type="button"
                      disabled={!size.inStock}
                      onClick={() => handleSizeChange(size.name)}
                      className={cn(
                        "flex items-center justify-center rounded-md border px-3 py-3 text-sm font-medium uppercase",
                        size.inStock
                          ? currentSize === size.name
                            ? "border-transparent bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:bg-accent"
                          : "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-50"
                      )}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={onAddToCart}
              className="mt-8 w-full"
              size="lg"
            >
              Add to bag
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
