import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess, requireMetadataOwnership } from "../../../helpers/verify-ownership"
import { wrapHandler } from "../../../helpers/wrap-handler"

export const GET = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  const collectionId = req.params.collectionId
  await requireStoreAccess(req, storeId)

  const productModule = req.scope.resolve(Modules.PRODUCT)

  const collection = await productModule.retrieveProductCollection(collectionId, {
    relations: ["products"],
  })
  requireMetadataOwnership(collection, storeId, "Collection")

  res.json({ collection })
})
