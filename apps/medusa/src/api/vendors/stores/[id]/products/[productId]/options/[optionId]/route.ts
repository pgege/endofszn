import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateProductOptionsWorkflow } from "@medusajs/medusa/core-flows"

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

interface UpdateOptionBody {
  metadata?: Record<string, any>
}

export async function PUT(
  req: AuthenticatedMedusaRequest<UpdateOptionBody>,
  res: MedusaResponse
) {
  const vendorId = req.auth_context?.actor_id
  const storeId = req.params.id
  const productId = req.params.productId
  const optionId = req.params.optionId

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

  const { metadata } = req.body

  await updateProductOptionsWorkflow(req.scope).run({
    input: {
      product_options: [
        {
          id: optionId,
          metadata,
        },
      ],
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: options } = await query.graph({
    entity: "product_option",
    filters: { id: optionId },
    fields: ["*", "values.*"],
  })

  res.json({ option: options[0] })
}
