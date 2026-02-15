import { createWidgetContext } from '../../components/primitives/widget-context'

export const { Provider: AggregateKpiProvider, useContext: useAggregateKpiContext } =
  createWidgetContext<{
    totalStores: number
    totalProducts: number
    publishedProducts: number
    draftProducts: number
    isLoading: boolean
  }>('AggregateKpi')
