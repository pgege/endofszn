import type { Product, Category, Collection } from './storefront'
import type {
  EcommerceProduct,
  EcommerceCategory,
  EcommerceImage,
  EcommerceColor,
  EcommerceSize,
} from '@/components/ecommerce/types'

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E'

export function formatPrice(amount: number, currencyCode = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
  }).format(amount / 100)
}

export function mapProduct(product: Product): EcommerceProduct {
  const images: EcommerceImage[] = product.images.map((img) => ({
    id: img.id,
    src: img.url,
    alt: product.title,
  }))

  return {
    id: product.id,
    name: product.title,
    href: `/products/${product.handle}`,
    price: product.price,
    imageSrc: product.thumbnail || images[0]?.src || PLACEHOLDER_IMAGE,
    imageAlt: product.title,
    images: images.length > 0 ? images : undefined,
    description: product.description || undefined,
    sizes: mapProductSizes(product),
    colors: mapProductColors(product),
    highlights: product.highlights.length > 0 ? product.highlights : undefined,
    details: product.details || undefined,
    inStock: true,
  }
}

export function mapProductSizes(product: Product): EcommerceSize[] {
  const sizeOption = product.optionsWithAvailability.find(
    (o) => o.name.toLowerCase() === 'size'
  )
  if (!sizeOption) return []
  return sizeOption.values.map((v) => ({
    name: v.value,
    inStock: v.inStock,
  }))
}

export function mapProductColors(product: Product): EcommerceColor[] {
  const colorOption = product.optionsWithAvailability.find(
    (o) => o.name.toLowerCase() === 'color'
  )
  if (!colorOption) return []
  return colorOption.values.map((v) => ({
    name: v.value,
    value: v.value,
  }))
}

export function mapCategory(category: Category): EcommerceCategory {
  return {
    id: category.id,
    name: category.name,
    href: `/categories/${category.handle}`,
    imageSrc: PLACEHOLDER_IMAGE,
    imageAlt: category.name,
    description: category.description || undefined,
  }
}

export function mapCollection(collection: Collection): EcommerceCategory {
  return {
    id: collection.id,
    name: collection.title,
    href: `/collections/${collection.handle}`,
    imageSrc: collection.imageSrc || PLACEHOLDER_IMAGE,
    imageAlt: collection.title,
    description: collection.description || undefined,
  }
}
