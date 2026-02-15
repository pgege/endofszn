import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { socketManager } from '@/lib/socket'
import { storeKeys } from '@/lib/api/auth'
import { productKeys } from '@/lib/api/products'
import { orderKeys } from '@/lib/api/orders'
import { inventoryKeys } from '@/lib/api/inventory'
import { customerKeys } from '@/lib/api/customers'
import { promotionKeys } from '@/lib/api/promotions'
import { collectionKeys } from '@/lib/api/collections'
import { shippingKeys } from '@/lib/api/shipping'
import { priceListKeys } from '@/lib/api/price-lists'
import { stockLocationKeys } from '@/lib/api/stock-locations'

interface MutationEvent {
  vendor_id: string
  store_id?: string
  entity: 'store' | 'product' | 'variant' | 'category' | 'product_option' | 'order' | 'fulfillment' | 'inventory_item' | 'customer' | 'promotion' | 'collection' | 'shipping_option' | 'price_list' | 'stock_location'
  action: 'created' | 'updated' | 'deleted' | 'bulk_updated'
  entity_id?: string
  entity_ids?: string[]
  data?: Record<string, unknown>
  timestamp: string
  source: 'user' | 'agent'
}

export function useVendorSync(vendorId: string | null | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!vendorId) return

    socketManager.connect()
    socketManager.joinVendorRoom(vendorId)

    const unsub = socketManager.on<MutationEvent>('store:entity_changed', (event) => {
      switch (event.entity) {
        case 'store':
          queryClient.invalidateQueries({ queryKey: storeKeys.all })
          break
        case 'product':
          if (event.store_id) {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() })
            queryClient.invalidateQueries({
              queryKey: ['uncategorized-products', event.store_id],
            })
          }
          break
        case 'variant':
          if (event.store_id) {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() })
          }
          break
        case 'category':
          if (event.store_id) {
            queryClient.invalidateQueries({ queryKey: ['categories', event.store_id] })
            queryClient.invalidateQueries({ queryKey: ['uncategorized-products', event.store_id] })
          }
          break
        case 'product_option':
          if (event.store_id) {
            queryClient.invalidateQueries({
              queryKey: ['products', 'list', event.store_id],
            })
          }
          break
        case 'order':
        case 'fulfillment':
          queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
          {
            const ids = event.entity_ids || (event.entity_id ? [event.entity_id] : [])
            ids.forEach((id) => {
              if (event.store_id) queryClient.invalidateQueries({ queryKey: orderKeys.detail(event.store_id, id) })
            })
          }
          break
        case 'inventory_item':
          queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
          break
        case 'customer':
          queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
          break
        case 'promotion':
          queryClient.invalidateQueries({ queryKey: promotionKeys.lists() })
          {
            const ids = event.entity_ids || (event.entity_id ? [event.entity_id] : [])
            ids.forEach((id) => {
              if (event.store_id) queryClient.invalidateQueries({ queryKey: promotionKeys.detail(event.store_id, id) })
            })
          }
          break
        case 'collection':
          queryClient.invalidateQueries({ queryKey: collectionKeys.lists() })
          {
            const ids = event.entity_ids || (event.entity_id ? [event.entity_id] : [])
            ids.forEach((id) => {
              if (event.store_id) queryClient.invalidateQueries({ queryKey: collectionKeys.detail(event.store_id, id) })
            })
          }
          break
        case 'shipping_option':
          queryClient.invalidateQueries({ queryKey: shippingKeys.lists() })
          break
        case 'price_list':
          queryClient.invalidateQueries({ queryKey: priceListKeys.lists() })
          {
            const ids = event.entity_ids || (event.entity_id ? [event.entity_id] : [])
            ids.forEach((id) => {
              if (event.store_id) queryClient.invalidateQueries({ queryKey: priceListKeys.detail(event.store_id, id) })
            })
          }
          break
        case 'stock_location':
          queryClient.invalidateQueries({ queryKey: stockLocationKeys.lists() })
          break
      }
    })

    return () => {
      unsub()
      socketManager.leaveVendorRoom(vendorId)
    }
  }, [vendorId, queryClient])
}
