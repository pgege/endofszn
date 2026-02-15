import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess, requireMetadataOwnership } from "../../../helpers/verify-ownership"
import { wrapHandler } from "../../../helpers/wrap-handler"

export const GET = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  const promotionId = req.params.promotionId
  await requireStoreAccess(req, storeId)

  const promotionModule = req.scope.resolve(Modules.PROMOTION)

  const promotion = await promotionModule.retrievePromotion(promotionId, {
    relations: ["rules", "application_method"],
  })
  requireMetadataOwnership(promotion, storeId, "Promotion")

  res.json({ promotion })
})
