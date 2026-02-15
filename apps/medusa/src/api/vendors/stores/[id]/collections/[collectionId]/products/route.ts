import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess, requireMetadataOwnership } from "../../../../helpers/verify-ownership"
import { wrapHandler } from "../../../../helpers/wrap-handler"

export const POST = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  const collectionId = req.params.collectionId
  await requireStoreAccess(req, storeId)

  const productModule = req.scope.resolve(Modules.PRODUCT)

  const collection = await productModule.retrieveProductCollection(collectionId)
  requireMetadataOwnership(collection, storeId, "Collection")

  const { add, remove } = req.body as { add?: string[]; remove?: string[] }

  if (add?.length) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: storeWithProducts } = await query.graph({
      entity: "store",
      filters: { id: storeId },
      fields: ["products.id"],
    })
    const storeProductIds = new Set((storeWithProducts[0]?.products || []).map((p: any) => p.id))
    const invalidIds = add.filter((id) => !storeProductIds.has(id))
    if (invalidIds.length > 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Products ${invalidIds.join(", ")} do not belong to this store`
      )
    }
    await productModule.updateProducts(
      { id: add } as any,
      { collection_id: collectionId } as any
    )
  }
  if (remove?.length) {
    await productModule.updateProducts(
      { id: remove } as any,
      { collection_id: null } as any
    )
  }

  const updated = await productModule.retrieveProductCollection(collectionId, {
    relations: ["products"],
  })

  res.json({ collection: updated })
})
