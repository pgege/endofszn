"use client"

import { useState } from "react"
import { StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type {
  EcommerceImage,
  EcommerceColor,
  EcommerceSize,
  EcommerceBreadcrumb,
} from "../types"

interface ProductOverview04Props {
  product: {
    name: string
    price: string
    rating?: number
    reviewCount?: number
    images: EcommerceImage[]
    colors?: EcommerceColor[]
    sizes?: EcommerceSize[]
    description?: string
    highlights?: string[]
    details?: string
    breadcrumbs?: EcommerceBreadcrumb[]
  }
  selectedColor?: string
  selectedSize?: string
  onColorChange?: (color: string) => void
  onSizeChange?: (size: string) => void
  onAddToCart?: () => void
  className?: string
}

export function ProductOverview04({
  product,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
  onAddToCart,
  className,
}: ProductOverview04Props) {
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
    <div data-slot="product-overview" className={cn("bg-background", className)}>
      <div className="pb-16 pt-6 sm:pb-24">
        {product.breadcrumbs && product.breadcrumbs.length > 0 && (
          <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ol className="flex items-center space-x-2">
              {product.breadcrumbs.map((breadcrumb, idx) => (
                <li key={breadcrumb.id} className="flex items-center">
                  <a
                    href={breadcrumb.href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    {breadcrumb.name}
                  </a>
                  {idx < product.breadcrumbs!.length - 1 && (
                    <svg
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      className="ml-2 h-5 w-5 shrink-0 text-muted-foreground/50"
                    >
                      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                    </svg>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="mx-auto mt-8 max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <div className="lg:grid lg:auto-rows-min lg:grid-cols-12 lg:gap-x-8">
            <div className="lg:col-span-5 lg:col-start-8">
              <div className="flex justify-between">
                <h1 className="text-xl font-medium text-foreground">
                  {product.name}
                </h1>
                <p className="text-xl font-medium text-foreground">{product.price}</p>
              </div>

              {product.rating !== undefined && (
                <div className="mt-4">
                  <div className="flex items-center">
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
                      <a
                        href="#reviews"
                        className="ml-2 text-sm font-medium text-primary hover:text-primary/80"
                      >
                        {product.reviewCount} reviews
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 lg:col-span-7 lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:mt-0">
              <div className="grid grid-cols-2 gap-4 lg:gap-8">
                {product.images.map((image, idx) => (
                  <img
                    key={image.id}
                    src={image.src}
                    alt={image.alt}
                    className={cn(
                      "rounded-lg object-cover",
                      idx === 0 ? "col-span-2 lg:row-span-2" : ""
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8 lg:col-span-5">
              {product.colors && product.colors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground">Color</h3>
                  <div className="mt-2 flex items-center gap-3">
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
                  <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
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

              {product.description && (
                <div className="mt-10">
                  <h2 className="text-sm font-medium text-foreground">Description</h2>
                  <p className="prose prose-sm mt-4 text-muted-foreground">
                    {product.description}
                  </p>
                </div>
              )}

              {product.highlights && product.highlights.length > 0 && (
                <div className="mt-8 border-t border-border pt-8">
                  <h2 className="text-sm font-medium text-foreground">
                    Fabric &amp; Care
                  </h2>
                  <ul className="prose prose-sm mt-4 list-disc pl-5 text-muted-foreground">
                    {product.highlights.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
