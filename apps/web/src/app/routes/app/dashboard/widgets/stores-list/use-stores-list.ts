import { useStores } from '@/lib/api/auth'

export function useStoresList() {
  const { data: storesData, isLoading } = useStores()
  const stores = storesData?.stores ?? []
  return { stores, isLoading }
}
