import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { wrapHandler } from "../../../../helpers/wrap-handler"

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

export const POST = wrapHandler(async (
  req: AuthenticatedMedusaRequest<{ urls: string[] }>,
  res: MedusaResponse
) => {
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

  const { urls } = req.body || {}
  if (!urls || urls.length === 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "No URLs provided")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    filters: { id: productId },
    fields: ["images.*"],
  })
  const existingImages = products[0]?.images || []
  const existingUrls = new Set(existingImages.map((img: any) => img.url))

  const newUrls = urls.filter((url: string) => !existingUrls.has(url))

  if (newUrls.length > 0) {
    const allImages = [
      ...existingImages.map((img: any) => ({ url: img.url })),
      ...newUrls.map((url: string) => ({ url })),
    ]

    await updateProductsWorkflow(req.scope).run({
      input: {
        products: [{
          id: productId,
          images: allImages,
        }],
      },
    })
  }

  const { data: updatedProducts } = await query.graph({
    entity: "product",
    filters: { id: productId },
    fields: ["images.*"],
  })
  const allUpdatedImages = updatedProducts[0]?.images || []

  const addedImages = allUpdatedImages.filter((img: any) => urls.includes(img.url))

  res.json({ images: addedImages, all_images: allUpdatedImages })
})

export const DELETE = wrapHandler(async (
  req: AuthenticatedMedusaRequest<{ image_ids: string[] }>,
  res: MedusaResponse
) => {
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

  const { image_ids } = req.body || {}
  if (!image_ids || image_ids.length === 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "No image IDs provided")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    filters: { id: productId },
    fields: ["images.*"],
  })
  const existingImages = products[0]?.images || []
  const idsToRemove = new Set(image_ids)
  const remainingImages = existingImages
    .filter((img: any) => !idsToRemove.has(img.id))
    .map((img: any) => ({ url: img.url }))

  await updateProductsWorkflow(req.scope).run({
    input: {
      products: [{
        id: productId,
        images: remainingImages,
      }],
    },
  })

  const { data: updatedProducts } = await query.graph({
    entity: "product",
    filters: { id: productId },
    fields: ["images.*"],
  })

  res.json({ images: updatedProducts[0]?.images || [] })
})
