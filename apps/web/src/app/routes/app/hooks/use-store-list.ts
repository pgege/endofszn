import { useMemo } from 'react'
import { useStores } from '@/lib/api/auth'
import { usePersistedState } from '@/hooks/use-persisted-state'
import type { ViewMode } from '@/components/data-toolbar'

export function useStoreList() {
  const { data: storesData, isLoading, error } = useStores()
  const stores = storesData?.stores ?? []
  const [viewMode, setViewMode] = usePersistedState<ViewMode>('stores-view-mode', 'grid')
  const [search, setSearch] = usePersistedState('stores-search', '')
  const [pageSize, setPageSize] = usePersistedState('stores-page-size', 20)
  const [page, setPage] = usePersistedState('stores-page', 1)

  const filtered = useMemo(() => {
    if (!search) return stores
    const term = search.toLowerCase()
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.profile?.description?.toLowerCase().includes(term),
    )
  }, [stores, search])

  const totalCount = filtered.length
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(page, pageCount)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return {
    stores: paginated,
    allStores: stores,
    totalCount,
    pageCount,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    isLoading,
    error,
    viewMode,
    setViewMode,
    search,
    setSearch,
  }
}
