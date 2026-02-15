import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess, getStoreProductIds } from "../../../helpers/verify-ownership"
import { wrapHandler } from "../../../helpers/wrap-handler"

export const GET = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  const customerId = req.params.customerId
  await requireStoreAccess(req, storeId)

  const productIds = await getStoreProductIds(req, storeId)
  const orderModule = req.scope.resolve(Modules.ORDER)
  const [customerOrders] = await orderModule.listAndCountOrders(
    { customer_id: customerId } as any,
    { select: ["id", "display_id", "status", "total", "currency_code", "created_at", "items.product_id"], relations: ["items"], take: 50 }
  )

  const storeOrders = customerOrders.filter((order: any) =>
    order.items?.some((item: any) => productIds.includes(item.product_id))
  )

  if (storeOrders.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Customer does not belong to this store")
  }

  const customerModule = req.scope.resolve(Modules.CUSTOMER)
  const customer = await customerModule.retrieveCustomer(customerId, {
    relations: ["addresses"],
  })

  if (!customer) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Customer ${customerId} not found`)
  }

  res.json({ customer, orders: storeOrders })
})
