import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { HttpTypes } from "@medusajs/framework/types"
import createVendorProductWorkflow from "../../../../../workflows/create-vendor-product"
import { VENDOR_MODULE } from "../../../../../modules/vendor"
import {
  validateCategoriesAreLeaves,
  validateProductHasCategory,
  storeHasCategories,
} from "../helpers/category-helpers"

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
      "products.*",
      "products.metadata",
      "products.variants.*",
      "products.variants.prices.*",
      "products.variants.images.*",
      "products.images.*",
      "products.options.*",
      "products.options.values.*",
      "products.categories.*",
    ],
  })

  const products = storeWithProducts[0]?.products || []

  res.json({ products })
}

export async function POST(
  req: AuthenticatedMedusaRequest<HttpTypes.AdminCreateProduct>,
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

  const categoryIds = (req.body as any).category_ids as string[] | undefined
  await validateProductHasCategory(req, storeId, categoryIds)
  if (categoryIds && categoryIds.length > 0) {
    await validateCategoriesAreLeaves(req, storeId, categoryIds)
  }

  const { result } = await createVendorProductWorkflow(req.scope).run({
    input: {
      store_id: storeId,
      product: req.body as any,
    },
  })

  const hasCategories = await storeHasCategories(req, storeId)
  const response: any = { product: result.product }
  if (hasCategories && (!categoryIds || categoryIds.length === 0)) {
    response.warning = "This store has categories. Consider assigning this product to a category."
  }

  res.status(201).json(response)
}
