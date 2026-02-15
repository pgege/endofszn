import { Store } from 'lucide-react'
import type { WidgetProps } from '../../types'
import { WidgetLoadingState, WidgetEmptyState } from '../../components/primitives/widget-states'
import { StoresListProvider } from './context'
import { useStoresList } from './use-stores-list'
import { SmallVariant } from './variants/SmallVariant'
import { MediumVariant } from './variants/MediumVariant'
import { LargeVariant } from './variants/LargeVariant'

export function StoresListWidget({ size }: WidgetProps) {
  const { stores, isLoading } = useStoresList()

  if (isLoading) return <WidgetLoadingState />
  if (stores.length === 0) return <WidgetEmptyState message="No stores yet" icon={Store} />

  return (
    <StoresListProvider value={{ stores, isLoading }}>
      {size === 'sm' && <SmallVariant />}
      {size === 'md' && <MediumVariant />}
      {size === 'lg' && <LargeVariant />}
    </StoresListProvider>
  )
}
