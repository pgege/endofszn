import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess, requireOrderBelongsToStore } from "../../../helpers/verify-ownership"
import { wrapHandler } from "../../../helpers/wrap-handler"

export const GET = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  const orderId = req.params.orderId
  await requireStoreAccess(req, storeId)
  await requireOrderBelongsToStore(req, storeId, orderId)

  const orderModule = req.scope.resolve(Modules.ORDER)

  const order = await orderModule.retrieveOrder(orderId, {
    relations: ["items", "shipping_address", "billing_address", "shipping_methods"],
  })
  res.json({ order })
})
