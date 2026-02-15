import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { requireStoreAccess, requireMetadataOwnership } from "../../../helpers/verify-ownership"
import { wrapHandler } from "../../../helpers/wrap-handler"

export const GET = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  const optionId = req.params.optionId
  await requireStoreAccess(req, storeId)

  const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT)

  const option = await fulfillmentModule.retrieveShippingOption(optionId, {
    relations: ["rules", "type"],
  })
  requireMetadataOwnership(option, storeId, "Shipping option")

  res.json({ shipping_option: option })
})
