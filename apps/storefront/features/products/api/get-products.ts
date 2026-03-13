import { storefront, type ProductListParams } from '@/lib/storefront'

export async function getProducts(params?: ProductListParams) {
  return storefront.products.list(params)
}

export async function getProductByHandle(handle: string) {
  return storefront.products.getByHandle(handle)
}
