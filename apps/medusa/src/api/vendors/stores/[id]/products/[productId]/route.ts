import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { wrapHandler } from "../../../helpers/wrap-handler"

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

async function verifyProductOwnership(
  req: AuthenticatedMedusaRequest,
  storeId: string,
  productId: string
): Promise<boolean> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithProducts } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["products.id"],
  })

  const products = storeWithProducts[0]?.products || []
  return products.some((product: any) => product.id === productId)
}

export const GET = wrapHandler(async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const vendorId = req.auth_context?.actor_id
  const storeId = req.params.id
  const productId = req.params.productId

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const [isStoreOwner, isProductOwner] = await Promise.all([
    verifyStoreOwnership(req, storeId),
    verifyProductOwnership(req, storeId, productId),
  ])

  if (!isStoreOwner) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Forbidden")
  }

  if (!isProductOwner) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const fieldsParam = req.query.fields as string | undefined

  const basicFields = [
    "id", "title", "handle", "subtitle", "description",
    "status", "thumbnail", "created_at", "updated_at", "metadata",
    "categories.id", "categories.name",
  ]

  const relationFields = [
    "images.*",
    "variants.id", "variants.title", "variants.sku", "variants.barcode",
    "variants.options", "variants.manage_inventory", "variants.allow_backorder",
    "variants.prices.*", "variants.images.*",
    "options.id", "options.title", "options.metadata", "options.values.*",
  ]

  const fields = fieldsParam === "basics" ? basicFields : [...basicFields, ...relationFields]

  const { data: products } = await query.graph({
    entity: "product",
    filters: { id: productId },
    fields,
  })

  if (!products.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
  }

  res.json({ product: products[0] })
})
