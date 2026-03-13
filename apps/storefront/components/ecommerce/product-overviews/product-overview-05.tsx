"use client"

import { useState } from "react"
import { StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { EcommerceColor, EcommerceSize, EcommerceTab } from "../types"

interface ProductOverview05Props {
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
    tabs?: EcommerceTab[]
  }
  selectedColor?: string
  selectedSize?: string
  onColorChange?: (color: string) => void
  onSizeChange?: (size: string) => void
  onAddToCart?: () => void
  className?: string
}

export function ProductOverview05({
  product,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
  onAddToCart,
  className,
}: ProductOverview05Props) {
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
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
          <div className="aspect-square overflow-hidden rounded-lg">
            <img
              src={product.imageSrc}
              alt={product.imageAlt}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {product.name}
            </h1>

            <div className="mt-3">
              <p className="text-3xl tracking-tight text-foreground">{product.price}</p>
            </div>

            {product.rating !== undefined && (
              <div className="mt-3">
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
                      className="ml-3 text-sm font-medium text-primary hover:text-primary/80"
                    >
                      {product.reviewCount} reviews
                    </a>
                  )}
                </div>
              </div>
            )}

            {product.description && (
              <div className="mt-6">
                <p className="text-base text-muted-foreground">{product.description}</p>
              </div>
            )}

            <div className="mt-6">
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
                  <div className="mt-2 grid grid-cols-4 gap-3 sm:grid-cols-8 lg:grid-cols-4">
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

              <Button onClick={onAddToCart} className="mt-10 w-full" size="lg">
                Add to bag
              </Button>
            </div>

            {product.tabs && product.tabs.length > 0 && (
              <div className="mt-12">
                <Tabs defaultValue={product.tabs[0].name}>
                  <TabsList className="w-full justify-start border-b border-border bg-transparent p-0">
                    {product.tabs.map((tab) => (
                      <TabsTrigger
                        key={tab.name}
                        value={tab.name}
                        className="rounded-none border-b-2 border-transparent px-4 pb-4 pt-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                      >
                        {tab.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {product.tabs.map((tab) => (
                    <TabsContent key={tab.name} value={tab.name} className="mt-6">
                      <div className="text-sm text-muted-foreground">{tab.content}</div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
