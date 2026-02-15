import { Store, Plus, Workflow, Settings } from 'lucide-react'
import { paths } from '@/config/paths'
import { useStores } from '@/lib/api/auth'
import { ActionButton } from '../../../components/primitives/action-button'

export function MediumVariant() {
  const { data: storesData } = useStores()
  const stores = storesData?.stores ?? []
  const settingsHref = stores[0]
    ? paths.app.stores.settings.getHref(stores[0].id)
    : paths.app.stores.new.getHref()

  return (
    <div className="grid grid-cols-2 gap-2 h-full">
      <ActionButton icon={Store} label="All Stores" href={paths.app.stores.list.getHref()} />
      <ActionButton icon={Plus} label="New Store" href={paths.app.stores.new.getHref()} />
      <ActionButton icon={Workflow} label="Workflows" href={paths.app.workflows.playground.getHref()} />
      <ActionButton icon={Settings} label="Settings" href={settingsHref} />
    </div>
  )
}
