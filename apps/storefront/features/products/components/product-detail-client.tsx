'use client'

import { useState, useCallback } from 'react'
import { ProductOverview01 } from '@/components/ecommerce/product-overviews'
import type { Product, ResolvedVariant } from '@/lib/storefront'
import { mapProduct, mapProductSizes, mapProductColors } from '@/lib/mappers'

const MEDUSA_PROTOCOL = process.env.NEXT_PUBLIC_MEDUSA_PROTOCOL || 'http'
const MEDUSA_HOST = process.env.NEXT_PUBLIC_MEDUSA_HOST || 'localhost'
const MEDUSA_PORT = process.env.NEXT_PUBLIC_MEDUSA_PORT || '9000'
const MEDUSA_URL = `${MEDUSA_PROTOCOL}://${MEDUSA_HOST}:${MEDUSA_PORT}`
const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID || ''

async function resolveVariantClient(
  handle: string,
  selections: Record<string, string>
): Promise<ResolvedVariant | null> {
  const params = new URLSearchParams(selections)
  try {
    const res = await fetch(
      `${MEDUSA_URL}/storefront-api/${STORE_ID}/products/${handle}/variant?${params}`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.variant
  } catch {
    return null
  }
}

interface ProductDetailClientProps {
  product: Product
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const mapped = mapProduct(product)
  const sizes = mapProductSizes(product)
  const colors = mapProductColors(product)

  const [currentPrice, setCurrentPrice] = useState(mapped.price)
  const [currentImages, setCurrentImages] = useState(
    mapped.images || [{ id: 'thumb', src: mapped.imageSrc, alt: mapped.imageAlt }]
  )
  const [selectedColor, setSelectedColor] = useState(colors[0]?.name ?? '')
  const [selectedSize, setSelectedSize] = useState(
    sizes.find((s) => s.inStock)?.name ?? ''
  )

  const tryResolve = useCallback(
    async (color: string, size: string) => {
      const selections: Record<string, string> = {}
      if (color) selections['Color'] = color
      if (size) selections['Size'] = size

      if (Object.keys(selections).length === 0) return

      const variant = await resolveVariantClient(product.handle, selections)
      if (variant) {
        setCurrentPrice(variant.price)
        if (variant.images.length > 0) {
          setCurrentImages(
            variant.images.map((img) => ({ id: img.id, src: img.url, alt: product.title }))
          )
        }
      }
    },
    [product.handle, product.title]
  )

  const handleColorChange = useCallback(
    (color: string) => {
      setSelectedColor(color)
      tryResolve(color, selectedSize)
    },
    [selectedSize, tryResolve]
  )

  const handleSizeChange = useCallback(
    (size: string) => {
      setSelectedSize(size)
      tryResolve(selectedColor, size)
    },
    [selectedColor, tryResolve]
  )

  const productData = {
    name: mapped.name,
    price: currentPrice,
    href: mapped.href,
    images: currentImages,
    colors,
    sizes,
    description: mapped.description,
    highlights: mapped.highlights,
    details: mapped.details,
  }

  return (
    <ProductOverview01
      product={productData}
      selectedColor={selectedColor}
      selectedSize={selectedSize}
      onColorChange={handleColorChange}
      onSizeChange={handleSizeChange}
    />
  )
}
