import { Store, Plus, Workflow, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/config/paths'
import { useStores } from '@/lib/api/auth'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const actions = [
  { icon: Store, label: 'Stores', getHref: () => paths.app.stores.list.getHref() },
  { icon: Plus, label: 'New Store', getHref: () => paths.app.stores.new.getHref() },
  { icon: Workflow, label: 'Workflows', getHref: () => paths.app.workflows.playground.getHref() },
]

export function SmallVariant() {
  const { data: storesData } = useStores()
  const stores = storesData?.stores ?? []
  const settingsHref = stores[0]
    ? paths.app.stores.settings.getHref(stores[0].id)
    : paths.app.stores.new.getHref()

  const allActions = [
    ...actions,
    { icon: Settings, label: 'Settings', getHref: () => settingsHref },
  ]

  return (
    <TooltipProvider>
      <div className="h-full grid grid-cols-4 gap-1">
        {allActions.map(({ icon: Icon, label, getHref }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Link
                to={getHref()}
                className="flex items-center justify-center hover:bg-muted/50 transition-colors"
              >
                <Icon className="h-4 w-4 text-primary" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
