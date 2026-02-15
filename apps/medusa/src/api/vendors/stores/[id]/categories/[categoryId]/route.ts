import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
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

async function verifyCategoryOwnership(
  req: AuthenticatedMedusaRequest,
  storeId: string,
  categoryId: string
): Promise<boolean> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithCategories } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["product_categories.id"],
  })

  const categories = storeWithCategories[0]?.product_categories || []
  return categories.some((cat: any) => cat.id === categoryId)
}

export const GET = wrapHandler(async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const vendorId = req.auth_context?.actor_id
  const storeId = req.params.id
  const categoryId = req.params.categoryId

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const isOwner = await verifyStoreOwnership(req, storeId)
  if (!isOwner) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Forbidden")
  }

  const isCategoryOwner = await verifyCategoryOwnership(req, storeId, categoryId)
  if (!isCategoryOwner) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Category not found")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: categories } = await query.graph({
    entity: "product_category",
    filters: { id: categoryId },
    fields: [
      "*",
      "parent_category.*",
      "category_children.*",
      "products.*",
      "products.variants.*",
      "products.images.*",
    ],
  })

  res.json({ category: categories[0] })
})
