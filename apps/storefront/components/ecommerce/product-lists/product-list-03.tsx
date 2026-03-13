"use client"

import { cn } from "@/lib/utils"
import type { EcommerceProduct, EcommerceColor } from "../types"

interface ProductWithColors extends EcommerceProduct {
  colors?: EcommerceColor[]
}

interface ProductList03Props {
  title?: string
  products: ProductWithColors[]
  className?: string
}

export function ProductList03({ title, products, className }: ProductList03Props) {
  return (
    <div data-slot="product-list" className={cn("bg-background", className)}>
      <div className="mx-auto max-w-7xl overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {title && (
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        )}
        <div className="mt-6 flex space-x-6 overflow-x-auto pb-4">
          {products.map((product) => (
            <div key={product.id} className="group relative w-64 shrink-0">
              <img
                src={product.imageSrc}
                alt={product.imageAlt}
                className="aspect-square w-full rounded-md bg-muted object-cover group-hover:opacity-75"
              />
              <div className="mt-4">
                <h3 className="text-sm text-foreground">
                  <a href={product.href}>
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.name}
                  </a>
                </h3>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {product.price}
                </p>
                {product.colors && product.colors.length > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    {product.colors.map((color) => (
                      <span
                        key={color.name}
                        className="h-4 w-4 rounded-full border border-border/30"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
