import { Store, Package, Globe, FileText } from 'lucide-react'
import { KpiCard } from '../../../components/primitives/kpi-card'
import { useAggregateKpiContext } from '../context'

export function MediumVariant() {
  const { totalStores, totalProducts, publishedProducts, draftProducts } = useAggregateKpiContext()

  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      <KpiCard label="Stores" value={totalStores} icon={Store} />
      <KpiCard label="Products" value={totalProducts} icon={Package} />
      <KpiCard label="Published" value={publishedProducts} icon={Globe} />
      <KpiCard label="Draft" value={draftProducts} icon={FileText} />
    </div>
  )
}
