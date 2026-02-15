import { Link } from 'react-router-dom'
import { ArrowLeft, Settings, Package, Users, ShoppingCart, FolderTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useStores } from '@/lib/api/auth'
import { useProducts } from '@/lib/api/products'
import { useCategories } from '@/lib/api/categories'
import { useOrders } from '@/lib/api/orders'
import { useCustomers } from '@/lib/api/customers'
import { paths } from '@/config/paths'
import { StatCard } from './components/store-stats'
import { GettingStarted } from './components/getting-started'
import { useStoreId } from './store-context'

export default function StoreDetailPage() {
  const storeId = useStoreId()
  const { data: storesData, isLoading: storeLoading, error: storeError } = useStores({ id: [storeId] })
  const store = storesData?.stores[0]
  const { data: productsData, isLoading: productsLoading } = useProducts(storeId)
  const products = productsData?.products
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories(storeId, { limit: 1000 })
  const categories = categoriesData?.categories
  const { data: ordersData } = useOrders(storeId, { limit: 1, offset: 0 })
  const { data: customersData } = useCustomers(storeId, { limit: 1, offset: 0 })

  const isLoading = storeLoading || productsLoading || categoriesLoading

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading store...</p>
        </div>
      </div>
    )
  }

  if (storeError || !store) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Store not found</h2>
          <p className="text-muted-foreground mb-4">The store you're looking for doesn't exist or you don't have access.</p>
          <Button asChild><Link to={paths.app.stores.list.getHref()}>Back to Stores</Link></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-8 space-y-6">
        <StoreHeader store={store} />

        {!store.profile?.isPublished && (
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/50">
            <CardContent className="py-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Your store is not published yet. Complete your{' '}
                <Link to={paths.app.stores.settings.getHref(store.id)} className="underline font-medium">store settings</Link>
                {' '}and publish it to make it visible to customers.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Products" count={productsData?.count ?? products?.length ?? 0} icon={Package} emptyText="No products yet" linkTo={paths.app.stores.products.list.getHref(store.id)} />
          <StatCard title="Categories" count={categoriesData?.count ?? categories?.length ?? 0} icon={FolderTree} emptyText="No categories yet" linkTo={paths.app.stores.categories.list.getHref(store.id)} />
          <StatCard title="Customers" count={customersData?.count || 0} icon={Users} emptyText="No customers yet" linkTo={paths.app.stores.customers.list.getHref(store.id)} />
          <StatCard title="Orders" count={ordersData?.count || 0} icon={ShoppingCart} emptyText="No orders yet" linkTo={paths.app.stores.orders.list.getHref(store.id)} />
        </div>

        <GettingStarted productCount={productsData?.count ?? products?.length ?? 0} />
      </div>
    </div>
  )
}

function StoreHeader({ store }: { store: { id: string; name: string; profile?: { logoUrl?: string; tagline?: string } } }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={paths.app.stores.list.getHref()}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex items-center gap-3">
          {store.profile?.logoUrl ? (
            <img src={store.profile.logoUrl} alt={store.name} className="h-12 w-12 object-cover" />
          ) : (
            <div className="h-12 w-12 bg-primary/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-base font-semibold">{store.name}</h1>
            {store.profile?.tagline && <p className="text-muted-foreground">{store.profile.tagline}</p>}
          </div>
        </div>
      </div>
      <Button variant="outline" asChild>
        <Link to={paths.app.stores.settings.getHref(store.id)}>
          <Settings className="h-4 w-4 mr-2" />Settings
        </Link>
      </Button>
    </div>
  )
}
