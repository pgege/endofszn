import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess, requireOrderBelongsToStore } from "../../../../helpers/verify-ownership"
import { wrapHandler } from "../../../../helpers/wrap-handler"

export const POST = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  const orderId = req.params.orderId
  await requireStoreAccess(req, storeId)
  await requireOrderBelongsToStore(req, storeId, orderId)

  const orderModule = req.scope.resolve(Modules.ORDER)

  try {
    const order = await orderModule.cancel(orderId)
    res.json({ order })
  } catch (err: any) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, err.message || "Failed to cancel order")
  }
})
