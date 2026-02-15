import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { paths } from '@/config/paths'
import { useStoreId } from '../store-context'

interface GettingStartedProps {
  productCount: number
}

export function GettingStarted({ productCount }: GettingStartedProps) {
  const storeId = useStoreId()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting Started</CardTitle>
        <CardDescription>Complete these steps to set up your store</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <StepItem
            step={1}
            title="Complete store profile"
            description="Add your logo, description, and contact info"
            actionLabel="Edit"
            actionHref={paths.app.stores.settings.getHref(storeId)}
          />
          <StepItem
            step={2}
            title="Add your first product"
            description={productCount > 0 ? `You have ${productCount} product${productCount !== 1 ? 's' : ''}` : 'Create products to sell in your store'}
            isComplete={productCount > 0}
            actionLabel="Add"
            actionIcon={<Plus className="h-4 w-4 mr-1" />}
            actionHref={paths.app.stores.products.new.getHref(storeId)}
          />
          <div className="flex items-center gap-4 p-4 border opacity-60">
            <div className="h-8 w-8 bg-muted flex items-center justify-center text-sm font-medium">3</div>
            <div className="flex-1">
              <h4 className="font-medium">Publish your store</h4>
              <p className="text-sm text-muted-foreground">Make your store visible to customers</p>
            </div>
            <Button variant="outline" size="sm" disabled>Coming soon</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StepItem({
  step, title, description, isComplete, actionLabel, actionIcon, actionHref,
}: {
  step: number
  title: string
  description: string
  isComplete?: boolean
  actionLabel: string
  actionIcon?: React.ReactNode
  actionHref: string
}) {
  return (
    <div className={`flex items-center gap-4 p-4 border ${isComplete ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' : ''}`}>
      <div className={`h-8 w-8 flex items-center justify-center text-sm font-medium ${isComplete ? 'bg-green-500 text-white' : 'bg-primary/10'}`}>
        {isComplete ? '✓' : step}
      </div>
      <div className="flex-1">
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <Link to={actionHref}>{actionIcon}{actionLabel}</Link>
      </Button>
    </div>
  )
}
