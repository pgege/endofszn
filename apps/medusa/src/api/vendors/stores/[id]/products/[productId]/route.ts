import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { HttpTypes } from "@medusajs/framework/types"
import {
  updateProductsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { VENDOR_MODULE } from "../../../../../../modules/vendor"

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

export async function GET(
  req: AuthenticatedMedusaRequest,
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

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    filters: { id: productId },
    fields: ["*", "metadata", "variants.*", "variants.prices.*", "variants.images.*", "images.*", "options.*", "options.values.*", "categories.*"],
  })

  if (!products.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
  }

  res.json({ product: products[0] })
}

export async function PUT(
  req: AuthenticatedMedusaRequest<HttpTypes.AdminUpdateProduct>,
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

  await updateProductsWorkflow(req.scope).run({
    input: {
      products: [
        {
          id: productId,
          ...req.body,
        },
      ],
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    filters: { id: productId },
    fields: ["*", "metadata", "variants.*", "variants.prices.*", "variants.images.*", "images.*", "options.*", "options.values.*", "categories.*"],
  })

  res.json({ product: products[0] })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
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

  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)

  await link.dismiss({
    [Modules.STORE]: { store_id: storeId },
    [Modules.PRODUCT]: { product_id: productId },
  })

  await deleteProductsWorkflow(req.scope).run({
    input: {
      ids: [productId],
    },
  })

  res.status(204).send()
}
