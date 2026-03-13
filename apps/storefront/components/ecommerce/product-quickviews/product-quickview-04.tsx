"use client"

import { useState } from "react"
import { StarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { EcommerceColor } from "../types"

export interface ProductQuickview04Product {
  name: string
  price: string
  imageSrc: string
  imageAlt: string
  description?: string
  rating?: number
  reviewCount?: number
  colors?: EcommerceColor[]
}

export interface ProductQuickview04Props {
  product: ProductQuickview04Product
  open?: boolean
  onOpenChange?: (open: boolean) => void
  selectedColor?: string
  onColorChange?: (color: string) => void
  onAddToCart?: () => void
  className?: string
}

export function ProductQuickview04({
  product,
  open,
  onOpenChange,
  selectedColor,
  onColorChange,
  onAddToCart,
  className,
}: ProductQuickview04Props) {
  const [internalColor, setInternalColor] = useState(
    selectedColor ?? product.colors?.[0]?.name ?? ""
  )

  const currentColor = selectedColor ?? internalColor

  const handleColorChange = (color: string) => {
    setInternalColor(color)
    onColorChange?.(color)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl p-0 gap-0 overflow-hidden"
      >
        <div
          data-slot="product-quickview"
          className={cn("flex flex-col sm:flex-row", className)}
        >
          <div className="relative aspect-square w-full sm:w-1/2 sm:min-h-[400px]">
            <img
              src={product.imageSrc}
              alt={product.imageAlt}
              className="h-full w-full object-cover"
            />
            <DialogClose
              className="absolute top-4 right-4 rounded-full bg-background/80 p-2 text-foreground opacity-70 backdrop-blur-sm transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              aria-label="Close"
            >
              <X className="size-4" />
            </DialogClose>
          </div>

          <div className="flex flex-1 flex-col p-6">
            <h2 className="text-lg font-semibold text-foreground">
              {product.name}
            </h2>
            <p className="mt-2 text-lg font-medium text-foreground">
              {product.price}
            </p>

            {product.rating !== undefined && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <StarIcon
                      key={star}
                      className={cn(
                        "size-4 shrink-0",
                        (product.rating ?? 0) > star
                          ? "fill-primary text-primary"
                          : "fill-muted text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
                {product.reviewCount !== undefined && (
                  <span className="text-sm text-muted-foreground">
                    ({product.reviewCount} reviews)
                  </span>
                )}
              </div>
            )}

            {product.colors && product.colors.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-foreground">Color</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      aria-label={color.name}
                      onClick={() => handleColorChange(color.name)}
                      className={cn(
                        "relative flex size-8 shrink-0 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                        currentColor === color.name &&
                          "ring-2 ring-ring ring-offset-2 ring-offset-background"
                      )}
                    >
                      <span
                        className="size-6 rounded-full border border-border"
                        style={{ backgroundColor: color.value }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.description && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-foreground">
                  Description
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {product.description}
                </p>
              </div>
            )}

            <Button
              onClick={onAddToCart}
              className="mt-6 w-full"
              size="lg"
            >
              Add to cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
