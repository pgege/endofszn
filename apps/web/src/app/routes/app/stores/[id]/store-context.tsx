import { createContext, useContext } from 'react'
import { useParams, Outlet } from 'react-router-dom'

const StoreContext = createContext<{ storeId: string }>(null!)

export function useStoreId() {
  return useContext(StoreContext).storeId
}

export function StoreLayout() {
  const { id } = useParams<{ id: string }>()
  return (
    <StoreContext.Provider value={{ storeId: id! }}>
      <Outlet />
    </StoreContext.Provider>
  )
}
