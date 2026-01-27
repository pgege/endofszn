import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Settings, Package, Users, ShoppingCart, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useStore } from '@/lib/api/auth'
import { useProducts } from '@/lib/api/products'
import { paths } from '@/config/paths'

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: store, isLoading, error } = useStore(id!)
  const { data: products } = useProducts(id!)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Store not found</h2>
        <p className="text-muted-foreground mb-4">
          The store you're looking for doesn't exist or you don't have access.
        </p>
        <Button asChild>
          <Link to={paths.app.root.getHref()}>Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={paths.app.root.getHref()}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            {store.profile?.logoUrl ? (
              <img
                src={store.profile.logoUrl}
                alt={store.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{store.name}</h1>
              {store.profile?.tagline && (
                <p className="text-muted-foreground">{store.profile.tagline}</p>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link to={paths.app.stores.settings.getHref(store.id)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </Button>
      </div>

      {!store.profile?.isPublished && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/50">
          <CardContent className="py-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Your store is not published yet. Complete your{' '}
              <Link
                to={paths.app.stores.settings.getHref(store.id)}
                className="underline font-medium"
              >
                store settings
              </Link>{' '}
              and publish it to make it visible to customers.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Link to={paths.app.stores.products.list.getHref(store.id)}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {products?.length ? 'Click to manage' : 'No products yet'}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No customers yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No orders yet</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Complete these steps to set up your store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg border">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Complete store profile</h4>
                <p className="text-sm text-muted-foreground">
                  Add your logo, description, and contact info
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to={paths.app.stores.settings.getHref(store.id)}>
                  Edit
                </Link>
              </Button>
            </div>
            <div className={`flex items-center gap-4 p-4 rounded-lg border ${products && products.length > 0 ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' : ''}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${products && products.length > 0 ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                {products && products.length > 0 ? '✓' : '2'}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Add your first product</h4>
                <p className="text-sm text-muted-foreground">
                  {products && products.length > 0
                    ? `You have ${products.length} product${products.length !== 1 ? 's' : ''}`
                    : 'Create products to sell in your store'}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to={paths.app.stores.products.new.getHref(store.id)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg border opacity-60">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Publish your store</h4>
                <p className="text-sm text-muted-foreground">
                  Make your store visible to customers
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming soon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
