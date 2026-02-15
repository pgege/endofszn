import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess, requireOrderBelongsToStore } from "../../../../helpers/verify-ownership"
import { wrapHandler } from "../../../../helpers/wrap-handler"

export const POST = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  const orderId = req.params.orderId
  await requireStoreAccess(req, storeId)
  const order = await requireOrderBelongsToStore(req, storeId, orderId)

  const { items, tracking_number, tracking_url, note } = req.body as any

  const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT)

  const fulfillmentItems = items || order.items?.map((item: any) => ({
    id: item.id,
    quantity: item.quantity,
  }))

  const fulfillment = await fulfillmentModule.createFulfillment({
    order_id: orderId,
    items: fulfillmentItems.map((fi: any) => ({
      title: fi.title || "Item",
      sku: fi.sku || "",
      quantity: fi.quantity,
      line_item_id: fi.id,
    })),
    labels: [],
    metadata: {
      tracking_number,
      tracking_url,
      note,
    },
  } as any)

  res.status(201).json({ fulfillment })
})
