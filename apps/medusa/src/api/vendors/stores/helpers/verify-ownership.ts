import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"

export async function verifyStoreOwnership(
  req: AuthenticatedMedusaRequest,
  storeId: string
): Promise<boolean> {
  const vendorId = req.auth_context?.actor_id
  if (!vendorId) return false

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: vendorWithStores } = await query.graph({
    entity: "vendor_admin",
    filters: { id: vendorId },
    fields: ["stores.id"],
  })

  const stores = vendorWithStores[0]?.stores || []
  return stores.some((store: any) => store.id === storeId)
}

export function requireVendor(req: AuthenticatedMedusaRequest): string {
  const vendorId = req.auth_context?.actor_id
  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }
  return vendorId
}

export async function requireStoreAccess(
  req: AuthenticatedMedusaRequest,
  storeId: string
): Promise<string> {
  const vendorId = requireVendor(req)
  const isOwner = await verifyStoreOwnership(req, storeId)
  if (!isOwner) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Forbidden")
  }
  return vendorId
}

export function requireMetadataOwnership(
  resource: any,
  storeId: string,
  resourceName: string
) {
  if (resource?.metadata?.store_id !== storeId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `${resourceName} does not belong to this store`
    )
  }
}

export async function getStoreProductIds(
  req: AuthenticatedMedusaRequest,
  storeId: string
): Promise<string[]> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: storeData } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["products.id"],
  })
  return (storeData[0]?.products || []).map((p: any) => p.id)
}

export async function requireOrderBelongsToStore(
  req: AuthenticatedMedusaRequest,
  storeId: string,
  orderId: string
) {
  const orderModule = req.scope.resolve(Modules.ORDER)
  const order = await orderModule.retrieveOrder(orderId, { relations: ["items"] })
  const productIds = await getStoreProductIds(req, storeId)

  const belongs = order.items?.some((item: any) =>
    productIds.includes(item.product_id)
  )

  if (!belongs) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Order does not belong to this store"
    )
  }

  return order
}
