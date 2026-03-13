import type { ReactNode } from "react"

export type EcommerceBreadcrumb = {
  id: string
  name: string
  href: string
}

export type EcommerceImage = {
  id: string
  src: string
  alt: string
}

export type EcommerceColor = {
  name: string
  value: string
  selectedClass?: string
  bgClass?: string
}

export type EcommerceSize = {
  name: string
  inStock: boolean
}

export type EcommercePrice = {
  amount: string
  currency?: string
  originalAmount?: string
}

export type EcommerceProduct = {
  id: string
  name: string
  href: string
  price: string
  originalPrice?: string
  imageSrc: string
  imageAlt: string
  images?: EcommerceImage[]
  rating?: number
  reviewCount?: number
  inStock?: boolean
  colors?: EcommerceColor[]
  sizes?: EcommerceSize[]
  features?: string[]
  details?: string
  description?: string
  breadcrumbs?: EcommerceBreadcrumb[]
  highlights?: string[]
  color?: string
}

export type EcommerceCategory = {
  id: string
  name: string
  href: string
  imageSrc: string
  imageAlt: string
  description?: string
}

export type EcommerceCartItem = {
  id: string
  name: string
  href: string
  price: string
  quantity: number
  imageSrc: string
  imageAlt: string
  color?: string
  size?: string
  inStock?: boolean
}

export type EcommerceReview = {
  id: string
  author: string
  avatarSrc?: string
  rating: number
  date: string
  title?: string
  content: string
}

export type EcommerceOrderItem = {
  id: string
  name: string
  href: string
  price: string
  quantity: number
  imageSrc: string
  imageAlt: string
  color?: string
  size?: string
  status?: string
  deliveryDate?: string
  deliveryDatetime?: string
}

export type EcommerceAddress = {
  name: string
  street: string
  city: string
  state: string
  zip: string
  country?: string
  phone?: string
}

export type EcommerceOrder = {
  id: string
  number: string
  date: string
  datetime: string
  status: string
  total: string
  items: EcommerceOrderItem[]
  shippingAddress?: EcommerceAddress
  billingAddress?: EcommerceAddress
  paymentMethod?: string
  shippingMethod?: string
  shippingPrice?: string
  subtotal?: string
  tax?: string
  invoiceHref?: string
  deliveryDate?: string
  deliveryDatetime?: string
}

export type EcommerceFilterOption = {
  value: string
  label: string
  checked?: boolean
}

export type EcommerceFilter = {
  id: string
  name: string
  options: EcommerceFilterOption[]
}

export type EcommerceActiveFilter = {
  value: string
  label: string
}

export type EcommerceSortOption = {
  name: string
  href: string
  current: boolean
}

export type EcommercePromo = {
  title: string
  description?: string
  href: string
  imageSrc: string
  imageAlt?: string
  cta?: string
}

export type EcommerceIncentive = {
  name: string
  description: string
  imageSrc?: string
  icon?: ReactNode
}

export type EcommerceNavFeatured = {
  name: string
  href: string
  imageSrc: string
  imageAlt: string
}

export type EcommerceNavSection = {
  id: string
  name: string
  items: { name: string; href: string }[]
}

export type EcommerceNavCategory = {
  id: string
  name: string
  featured: EcommerceNavFeatured[]
  sections: EcommerceNavSection[]
}

export type EcommerceNavPage = {
  name: string
  href: string
}

export type EcommerceNavigation = {
  categories: EcommerceNavCategory[]
  pages: EcommerceNavPage[]
}

export type EcommerceTestimonial = {
  id: string
  quote: string
  attribution: string
}

export type EcommerceOffer = {
  name: string
  description: string
  href: string
}

export type EcommerceRatingBreakdown = {
  rating: number
  count: number
  percentage: number
}

export type EcommerceProductFeature = {
  name: string
  description: string
  imageSrc?: string
  imageAlt?: string
  icon?: ReactNode
}

export type EcommerceTab = {
  name: string
  content: ReactNode
}
