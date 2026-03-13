"use client"

import { useState } from "react"
import { StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type {
  EcommerceProduct,
  EcommerceImage,
  EcommerceColor,
  EcommerceSize,
  EcommerceBreadcrumb,
} from "../types"

interface ProductOverview01Props {
  product: {
    name: string
    price: string
    href?: string
    breadcrumbs?: EcommerceBreadcrumb[]
    images: EcommerceImage[]
    colors?: EcommerceColor[]
    sizes?: EcommerceSize[]
    rating?: number
    reviewCount?: number
    description?: string
    highlights?: string[]
    details?: string
  }
  policies?: { name: string; icon?: React.ReactNode; description: string }[]
  selectedColor?: string
  selectedSize?: string
  onColorChange?: (color: string) => void
  onSizeChange?: (size: string) => void
  onAddToCart?: () => void
  className?: string
}

export function ProductOverview01({
  product,
  policies,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
  onAddToCart,
  className,
}: ProductOverview01Props) {
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
      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {product.breadcrumbs && product.breadcrumbs.length > 0 && (
          <ol className="flex items-center space-x-2 py-4">
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
            <li className="text-sm font-medium text-foreground">{product.name}</li>
          </ol>
        )}
      </nav>

      <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr] lg:gap-x-8 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="lg:col-span-2 lg:border-r lg:border-border lg:pr-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {product.name}
          </h1>
        </div>

        <div className="mt-4 lg:row-span-3 lg:mt-0">
          <p className="text-3xl tracking-tight text-foreground">{product.price}</p>

          {product.rating !== undefined && (
            <div className="mt-6">
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

          <div className="mt-10">
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground">Color</h3>
                <fieldset aria-label="Choose a color" className="mt-4">
                  <div className="flex items-center gap-3">
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
                </fieldset>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Size</h3>
                </div>
                <RadioGroup
                  value={currentSize}
                  onValueChange={handleSizeChange}
                  className="mt-4 grid grid-cols-4 gap-4 sm:grid-cols-8 lg:grid-cols-4"
                >
                  {product.sizes.map((size) => (
                    <div key={size.name}>
                      <RadioGroupItem
                        value={size.name}
                        id={`size-${size.name}`}
                        disabled={!size.inStock}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`size-${size.name}`}
                        className={cn(
                          "flex cursor-pointer items-center justify-center rounded-md border px-3 py-3 text-sm font-medium uppercase",
                          size.inStock
                            ? "border-border bg-background text-foreground hover:bg-accent peer-data-[state=checked]:border-transparent peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                            : "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-50"
                        )}
                      >
                        {size.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <Button
              onClick={onAddToCart}
              className="mt-10 w-full"
              size="lg"
            >
              Add to bag
            </Button>
          </div>
        </div>

        <div className="py-10 lg:col-span-2 lg:col-start-1 lg:border-r lg:border-border lg:pb-16 lg:pr-8 lg:pt-6">
          {product.description && (
            <div>
              <h3 className="sr-only">Description</h3>
              <p className="text-base text-muted-foreground">{product.description}</p>
            </div>
          )}

          {product.highlights && product.highlights.length > 0 && (
            <div className="mt-10">
              <h3 className="text-sm font-medium text-foreground">Highlights</h3>
              <ul className="mt-4 list-disc space-y-2 pl-4 text-sm">
                {product.highlights.map((highlight, idx) => (
                  <li key={idx} className="text-muted-foreground">
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.details && (
            <div className="mt-10">
              <h2 className="text-sm font-medium text-foreground">Details</h2>
              <p className="mt-4 text-sm text-muted-foreground">{product.details}</p>
            </div>
          )}
        </div>
      </div>

      {product.images && product.images.length > 0 && (
        <div className="mx-auto mt-6 max-w-2xl sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:gap-x-8 lg:px-8">
          {product.images[0] && (
            <img
              src={product.images[0].src}
              alt={product.images[0].alt}
              className="hidden aspect-[3/4] w-full rounded-lg object-cover lg:block"
            />
          )}
          <div className="hidden lg:grid lg:grid-cols-1 lg:gap-y-8">
            {product.images[1] && (
              <img
                src={product.images[1].src}
                alt={product.images[1].alt}
                className="aspect-[3/2] w-full rounded-lg object-cover"
              />
            )}
            {product.images[2] && (
              <img
                src={product.images[2].src}
                alt={product.images[2].alt}
                className="aspect-[3/2] w-full rounded-lg object-cover"
              />
            )}
          </div>
          {product.images[3] && (
            <img
              src={product.images[3].src}
              alt={product.images[3].alt}
              className="aspect-[4/5] w-full rounded-lg object-cover sm:rounded-lg lg:aspect-[3/4]"
            />
          )}
        </div>
      )}

      {policies && policies.length > 0 && (
        <section className="mt-16 border-t border-border lg:mt-24">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
              {policies.map((policy) => (
                <div key={policy.name}>
                  {policy.icon && (
                    <div className="text-muted-foreground">{policy.icon}</div>
                  )}
                  <h3 className="mt-6 text-sm font-medium text-foreground">
                    {policy.name}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {policy.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
