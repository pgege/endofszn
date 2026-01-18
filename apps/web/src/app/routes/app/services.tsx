import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

type MedusaHealth = {
  status: string
  medusaUrl: string
}

type MedusaProducts = {
  products: Array<{
    id: string
    title: string
    description: string
    handle: string
  }>
  count: number
}

type MedusaRegions = {
  regions: Array<{
    id: string
    name: string
    currency_code: string
  }>
  count: number
}

type MedusaCollections = {
  collections: Array<{
    id: string
    title: string
    handle: string
  }>
  count: number
}

function StatusBadge({ status }: { status: 'healthy' | 'unhealthy' | 'loading' | 'error' }) {
  switch (status) {
    case 'healthy':
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Healthy
        </Badge>
      )
    case 'unhealthy':
      return (
        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          <AlertCircle className="w-3 h-3 mr-1" />
          Unhealthy
        </Badge>
      )
    case 'error':
      return (
        <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
          <XCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      )
    default:
      return (
        <Badge variant="outline">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Checking...
        </Badge>
      )
  }
}

export default function ServicesRoute() {
  const healthQuery = useQuery({
    queryKey: ['medusa', 'health'],
    queryFn: () => api.get<MedusaHealth>('/api/medusa/health'),
    retry: false,
  })

  const productsQuery = useQuery({
    queryKey: ['medusa', 'products'],
    queryFn: () => api.get<MedusaProducts>('/api/medusa/products?limit=5'),
    enabled: healthQuery.data?.status === 'healthy',
  })

  const regionsQuery = useQuery({
    queryKey: ['medusa', 'regions'],
    queryFn: () => api.get<MedusaRegions>('/api/medusa/regions'),
    enabled: healthQuery.data?.status === 'healthy',
  })

  const collectionsQuery = useQuery({
    queryKey: ['medusa', 'collections'],
    queryFn: () => api.get<MedusaCollections>('/api/medusa/collections'),
    enabled: healthQuery.data?.status === 'healthy',
  })

  const getHealthStatus = () => {
    if (healthQuery.isLoading) return 'loading'
    if (healthQuery.isError) return 'error'
    return healthQuery.data?.status === 'healthy' ? 'healthy' : 'unhealthy'
  }

  const refetchAll = () => {
    healthQuery.refetch()
    productsQuery.refetch()
    regionsQuery.refetch()
    collectionsQuery.refetch()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Services Status</h1>
          <p className="text-muted-foreground mt-1">
            Monitor communication between API and Medusa
          </p>
        </div>
        <Button onClick={refetchAll} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh All
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Medusa Backend</CardTitle>
              <StatusBadge status={getHealthStatus()} />
            </div>
            <CardDescription>
              E-commerce backend service health check
            </CardDescription>
          </CardHeader>
          <CardContent>
            {healthQuery.isLoading && (
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking health...
              </div>
            )}
            {healthQuery.isError && (
              <div className="text-red-500">
                <p className="font-medium">Connection Failed</p>
                <p className="text-sm mt-1">
                  Could not connect to Medusa. Make sure the service is running.
                </p>
              </div>
            )}
            {healthQuery.data && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">{healthQuery.data.status}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">URL:</span>
                  <span className="font-mono text-xs">{healthQuery.data.medusaUrl}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Products from Medusa store
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productsQuery.isLoading && (
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading products...
              </div>
            )}
            {productsQuery.isError && (
              <p className="text-red-500 text-sm">Failed to load products</p>
            )}
            {!healthQuery.data && !healthQuery.isLoading && (
              <p className="text-muted-foreground text-sm">
                Waiting for Medusa connection...
              </p>
            )}
            {productsQuery.data && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Total: {productsQuery.data.count} products
                </div>
                {productsQuery.data.products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No products found. Run seed to add sample data.</p>
                ) : (
                  <ul className="space-y-2">
                    {productsQuery.data.products.map((product) => (
                      <li key={product.id} className="text-sm border-l-2 border-primary/20 pl-3">
                        <span className="font-medium">{product.title}</span>
                        <span className="text-muted-foreground ml-2">({product.handle})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regions</CardTitle>
            <CardDescription>
              Available regions and currencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {regionsQuery.isLoading && (
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading regions...
              </div>
            )}
            {regionsQuery.isError && (
              <p className="text-red-500 text-sm">Failed to load regions</p>
            )}
            {!healthQuery.data && !healthQuery.isLoading && (
              <p className="text-muted-foreground text-sm">
                Waiting for Medusa connection...
              </p>
            )}
            {regionsQuery.data && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Total: {regionsQuery.data.count} regions
                </div>
                {regionsQuery.data.regions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No regions found. Run seed to add sample data.</p>
                ) : (
                  <ul className="space-y-2">
                    {regionsQuery.data.regions.map((region) => (
                      <li key={region.id} className="text-sm flex items-center justify-between border-l-2 border-primary/20 pl-3">
                        <span className="font-medium">{region.name}</span>
                        <Badge variant="outline" className="uppercase">{region.currency_code}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collections</CardTitle>
            <CardDescription>
              Product collections from store
            </CardDescription>
          </CardHeader>
          <CardContent>
            {collectionsQuery.isLoading && (
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading collections...
              </div>
            )}
            {collectionsQuery.isError && (
              <p className="text-red-500 text-sm">Failed to load collections</p>
            )}
            {!healthQuery.data && !healthQuery.isLoading && (
              <p className="text-muted-foreground text-sm">
                Waiting for Medusa connection...
              </p>
            )}
            {collectionsQuery.data && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Total: {collectionsQuery.data.count} collections
                </div>
                {collectionsQuery.data.collections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No collections found. Run seed to add sample data.</p>
                ) : (
                  <ul className="space-y-2">
                    {collectionsQuery.data.collections.map((collection) => (
                      <li key={collection.id} className="text-sm border-l-2 border-primary/20 pl-3">
                        <span className="font-medium">{collection.title}</span>
                        <span className="text-muted-foreground ml-2">({collection.handle})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
