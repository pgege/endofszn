import { storefront, type CollectionListParams } from '@/lib/storefront'

export async function getCollections(params?: CollectionListParams) {
  return storefront.collections.list(params)
}

export async function getCollectionByHandle(handle: string) {
  return storefront.collections.getByHandle(handle)
}
