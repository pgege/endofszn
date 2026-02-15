import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Package, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useStoreId } from '../../store-context'
import { useOrders, useCreateFulfillment, useCancelOrder } from '@/lib/api/orders'
import { paths } from '@/config/paths'
import { toast } from 'sonner'
import { useState } from 'react'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'usd' }).format(amount / 100)
}

export default function OrderDetailPage() {
  const storeId = useStoreId()
  const { orderId } = useParams<{ orderId: string }>()
  const { data: ordersData, isLoading, error } = useOrders(storeId, { id: [orderId!] })
  const order = ordersData?.orders[0]
  const fulfillMutation = useCreateFulfillment(storeId, orderId!)
  const cancelMutation = useCancelOrder(storeId, orderId!)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading order...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Order not found</h2>
          <p className="text-muted-foreground mb-4">{error?.message || 'Something went wrong'}</p>
          <Button asChild>
            <Link to={paths.app.stores.orders.list.getHref(storeId)}>Back to Orders</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to={paths.app.stores.orders.list.getHref(storeId)}><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-lg font-semibold">Order #{order.display_id || order.id.slice(-6)}</h1>
            <Badge variant="secondary">{order.status}</Badge>
          </div>
          <div className="flex gap-2">
            {order.status !== 'canceled' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fulfillMutation.mutate({}, { onSuccess: () => toast.success('Fulfillment created'), onError: (e) => toast.error(e.message) })}
                  disabled={fulfillMutation.isPending}
                >
                  <Truck className="h-4 w-4 mr-1" /> Fulfill
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={cancelMutation.isPending}
                >
                  Cancel Order
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Items</CardTitle></CardHeader>
            <CardContent>
              {order.items?.length ? (
                <div className="divide-y">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt="" className="h-10 w-10 object-cover" />
                        ) : (
                          <div className="h-10 w-10 bg-muted flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium">{formatCurrency(item.unit_price * item.quantity, order.currency_code)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No items</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(order.subtotal || 0, order.currency_code)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatCurrency(order.shipping_total || 0, order.currency_code)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(order.tax_total || 0, order.currency_code)}</span></div>
              {(order.discount_total || 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatCurrency(order.discount_total || 0, order.currency_code)}</span></div>}
              <div className="flex justify-between font-medium pt-2 border-t"><span>Total</span><span>{formatCurrency(order.total || 0, order.currency_code)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Customer</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <p>{order.email || 'No email'}</p>
              {order.shipping_address && (
                <div className="mt-2 text-muted-foreground">
                  <p>{order.shipping_address?.first_name} {order.shipping_address?.last_name}</p>
                  <p>{order.shipping_address?.address_1}</p>
                  <p>{order.shipping_address?.city}, {order.shipping_address?.province} {order.shipping_address?.postal_code}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel order #{order.display_id || order.id.slice(-6)}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                cancelMutation.mutate(undefined, {
                  onSuccess: () => { toast.success('Order canceled'); setShowCancelDialog(false) },
                  onError: (e) => toast.error(e.message),
                })
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
