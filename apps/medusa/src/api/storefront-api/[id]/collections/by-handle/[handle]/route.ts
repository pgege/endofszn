import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeId = req.params.id
  const handle = req.params.handle

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithCollections } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: [
      "product_collections.id",
      "product_collections.title",
      "product_collections.handle",
      "product_collections.description",
      "product_collections.metadata",
      "product_collections.created_at",
      "product_collections.updated_at",
      "product_collections.products.thumbnail",
    ],
  })

  const allCollections = (storeWithCollections[0]?.product_collections || []) as any[]
  const raw = allCollections.find((c: any) => c.handle === handle)

  if (!raw) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Collection with handle "${handle}" not found in this store`)
  }

  const products = raw.products || []
  const firstProductThumb = products.find((p: any) => p.thumbnail)?.thumbnail ?? null

  res.json({
    collection: {
      id: raw.id,
      title: raw.title,
      handle: raw.handle,
      description: raw.description ?? null,
      imageSrc: firstProductThumb,
      metadata: raw.metadata ?? null,
      created_at: raw.created_at ?? "",
      updated_at: raw.updated_at ?? "",
    },
  })
}
