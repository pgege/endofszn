import { storefront, type CategoryListParams } from '@/lib/storefront'

export async function getCategories(params?: CategoryListParams) {
  return storefront.categories.list(params)
}

export async function getCategoryByHandle(handle: string) {
  return storefront.categories.getByHandle(handle)
}
