import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import {
  validateCategoriesAreLeaves,
  getStoreCategories,
} from "../helpers/category-helpers"
import { wrapHandler } from "../../helpers/wrap-handler"

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

async function verifyProductsOwnership(
  req: AuthenticatedMedusaRequest,
  storeId: string,
  productIds: string[]
): Promise<string[]> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithProducts } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["products.id"],
  })

  const storeProductIds = new Set(
    (storeWithProducts[0]?.products || []).map((p: any) => p.id)
  )

  const invalidProducts = productIds.filter((id) => !storeProductIds.has(id))
  return invalidProducts
}

interface BulkCategorizeBody {
  assignments: Array<{
    product_id: string
    category_ids: string[]
  }>
}

export const POST = wrapHandler(async (
  req: AuthenticatedMedusaRequest<BulkCategorizeBody>,
  res: MedusaResponse
) => {
  const vendorId = req.auth_context?.actor_id
  const storeId = req.params.id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const isOwner = await verifyStoreOwnership(req, storeId)
  if (!isOwner) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Forbidden")
  }

  const { assignments } = req.body

  if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "assignments array is required"
    )
  }

  const productIds = assignments.map((a) => a.product_id)
  const invalidProducts = await verifyProductsOwnership(req, storeId, productIds)
  if (invalidProducts.length > 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Products do not belong to this store: ${invalidProducts.join(", ")}`
    )
  }

  const allCategoryIds = [...new Set(assignments.flatMap((a) => a.category_ids))]
  await validateCategoriesAreLeaves(req, storeId, allCategoryIds)

  const updateData = assignments.map((assignment) => ({
    id: assignment.product_id,
    category_ids: assignment.category_ids,
  }))

  await updateProductsWorkflow(req.scope).run({
    input: {
      products: updateData,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: updatedProducts } = await query.graph({
    entity: "product",
    filters: { id: productIds },
    fields: ["id", "title", "categories.*"],
  })

  res.json({
    updated_products: updatedProducts,
    count: updatedProducts.length,
  })
})
