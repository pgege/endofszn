import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

async function verifyStoreOwnership(
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

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const vendorId = req.auth_context?.actor_id
  const storeId = req.params.id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const isOwner = await verifyStoreOwnership(req, storeId)
  if (!isOwner) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Forbidden")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithProducts } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: [
      "products.id",
      "products.title",
      "products.handle",
      "products.thumbnail",
      "products.categories.id",
    ],
  })

  const products = storeWithProducts[0]?.products || []

  const uncategorizedProducts = products.filter((product: any) => {
    const categories = product.categories || []
    return categories.length === 0
  })

  res.json({
    uncategorized_products: uncategorizedProducts.map((p: any) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      thumbnail: p.thumbnail,
    })),
    count: uncategorizedProducts.length,
    total_products: products.length,
  })
}
