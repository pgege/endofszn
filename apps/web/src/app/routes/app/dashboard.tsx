import { Link } from 'react-router-dom'
import { Plus, Store as StoreIcon, Settings } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { paths } from '@/config/paths'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { vendor, stores } = useAuth()

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {vendor?.firstName || 'there'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your stores and products
          </p>
        </div>
        <Button asChild>
          <Link to={paths.app.stores.new.getHref()}>
            <Plus className="h-4 w-4 mr-2" />
            New Store
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Stores</h2>
        {stores.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <StoreIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No stores yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first store to start selling products
              </p>
              <Button asChild>
                <Link to={paths.app.stores.new.getHref()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Store
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <Card key={store.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {store.profile?.logoUrl ? (
                        <img
                          src={store.profile.logoUrl}
                          alt={store.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <StoreIcon className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{store.name}</CardTitle>
                        {store.profile?.isPublished ? (
                          <span className="text-xs text-green-600 font-medium">Published</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Draft</span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={paths.app.stores.settings.getHref(store.id)}>
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                    {store.profile?.description || 'No description'}
                  </CardDescription>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={paths.app.stores.detail.getHref(store.id)}>
                        Manage Store
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card className="border-dashed hover:border-primary/50 transition-colors">
              <Link
                to={paths.app.stores.new.getHref()}
                className="flex flex-col items-center justify-center h-full min-h-[200px] p-6"
              >
                <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-muted-foreground font-medium">Add Store</span>
              </Link>
            </Card>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
