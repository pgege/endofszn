import { storefront } from '@/lib/storefront'

export async function getStore() {
  return storefront.store.get()
}
