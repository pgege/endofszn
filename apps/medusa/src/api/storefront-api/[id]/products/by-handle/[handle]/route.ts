import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { normalizeProduct } from "../../../../helpers"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeId = req.params.id
  const handle = req.params.handle

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithProducts } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: [
      "products.id",
      "products.title",
      "products.handle",
      "products.subtitle",
      "products.description",
      "products.status",
      "products.thumbnail",
      "products.created_at",
      "products.updated_at",
      "products.metadata",
      "products.images.*",
      "products.variants.id",
      "products.variants.title",
      "products.variants.sku",
      "products.variants.manage_inventory",
      "products.variants.allow_backorder",
      "products.variants.options.*",
      "products.variants.prices.*",
      "products.options.id",
      "products.options.title",
      "products.options.values.*",
      "products.categories.id",
      "products.categories.name",
      "products.categories.handle",
    ],
  })

  const allProducts = storeWithProducts[0]?.products || []
  const product = allProducts.find(
    (p: any) => p.handle === handle && p.status === "published"
  )

  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Product with handle "${handle}" not found in this store`)
  }

  res.json({ product: normalizeProduct(product) })
}
