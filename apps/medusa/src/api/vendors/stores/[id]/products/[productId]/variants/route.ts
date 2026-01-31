import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createProductVariantsWorkflow, deleteProductVariantsWorkflow } from "@medusajs/medusa/core-flows"

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

interface CreateVariantsBody {
  variants: Array<{
    title: string
    sku?: string
    options?: Record<string, string>
    prices?: Array<{ amount: number; currency_code: string }>
  }>
}

interface DeleteVariantsBody {
  variant_ids: string[]
}

export async function POST(
  req: AuthenticatedMedusaRequest<CreateVariantsBody>,
  res: MedusaResponse
) {
  const vendorId = req.auth_context?.actor_id
  const storeId = req.params.id
  const productId = req.params.productId

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const isStoreOwner = await verifyStoreOwnership(req, storeId)
  if (!isStoreOwner) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Forbidden")
  }

  const isProductOwner = await verifyProductOwnership(req, storeId, productId)
  if (!isProductOwner) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
  }

  const { variants } = req.body

  if (!variants || variants.length === 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Variants are required")
  }

  const variantsInput = variants.map((v) => ({
    product_id: productId,
    title: v.title,
    sku: v.sku,
    options: v.options,
    prices: v.prices,
  }))

  const result = await createProductVariantsWorkflow(req.scope).run({
    input: {
      product_variants: variantsInput,
    },
  })

  res.json({ variants: result.result })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest<DeleteVariantsBody>,
  res: MedusaResponse
) {
  const vendorId = req.auth_context?.actor_id
  const storeId = req.params.id
  const productId = req.params.productId

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const isStoreOwner = await verifyStoreOwnership(req, storeId)
  if (!isStoreOwner) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Forbidden")
  }

  const isProductOwner = await verifyProductOwnership(req, storeId, productId)
  if (!isProductOwner) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
  }

  const { variant_ids } = req.body

  if (!variant_ids || variant_ids.length === 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Variant IDs are required")
  }

  await deleteProductVariantsWorkflow(req.scope).run({
    input: {
      ids: variant_ids,
    },
  })

  res.json({ success: true, deleted_ids: variant_ids })
}
