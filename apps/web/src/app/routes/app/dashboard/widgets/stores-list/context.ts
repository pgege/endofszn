import type { Store } from '@/lib/api/auth'
import { createWidgetContext } from '../../components/primitives/widget-context'

export const { Provider: StoresListProvider, useContext: useStoresListContext } =
  createWidgetContext<{ stores: Store[]; isLoading: boolean }>('StoresList')
