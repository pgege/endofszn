import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStoreId } from '../../store-context'
import { useCustomers } from '@/lib/api/customers'
import { paths } from '@/config/paths'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'usd' }).format(amount / 100)
}

export default function CustomerDetailPage() {
  const storeId = useStoreId()
  const { customerId } = useParams<{ customerId: string }>()
  const { data: customersData, isLoading, error } = useCustomers(storeId, { id: [customerId!] })
  const customer = customersData?.customers[0]

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading customer...</p>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Customer not found</h2>
          <p className="text-muted-foreground mb-4">{error?.message || 'Something went wrong'}</p>
          <Button asChild>
            <Link to={paths.app.stores.customers.list.getHref(storeId)}>Back to Customers</Link>
          </Button>
        </div>
      </div>
    )
  }

  const orders = (customer as any).orders ?? []
  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Unknown'

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to={paths.app.stores.customers.list.getHref(storeId)}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-lg font-semibold">{fullName}</h1>
          <Badge variant={customer.has_account ? 'default' : 'secondary'}>
            {customer.has_account ? 'Registered' : 'Guest'}
          </Badge>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span>{fullName}</span></div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>{customer.email}</span></div>
              {customer.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{customer.phone}</span></div>}
              <div className="text-muted-foreground">Member since {new Date(customer.created_at).toLocaleDateString()}</div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">Order History ({orders.length})</CardTitle></CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <div className="divide-y">
                  {orders.map((order: any) => (
                    <Link
                      key={order.id}
                      to={paths.app.stores.orders.detail.getHref(storeId, order.id)}
                      className="flex items-center justify-between py-3 hover:bg-muted/30 -mx-4 px-4"
                    >
                      <div>
                        <p className="text-sm font-medium">#{order.display_id || order.id.slice(-6)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{order.status}</Badge>
                        <span className="text-sm font-medium">{formatCurrency(order.total || 0, order.currency_code)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
