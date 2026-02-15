export interface OptionValueInput {
  value: string
  colorHex?: string
  imageUrl?: string
}

export interface OptionInput {
  title: string
  values: OptionValueInput[]
  isColor?: boolean
}

export interface VariantInput {
  id: string
  optionValues: Record<string, string>
  title: string
  sku: string
  price: string
  currency: string
  images: string[]
  quantity?: number
}

export interface SectionInput {
  name: string
  content: string
}

export type { CategoryOption } from './category-autocomplete'
