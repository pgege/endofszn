import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess, requireOrderBelongsToStore } from "../../helpers/verify-ownership"
import { wrapHandler } from "../../helpers/wrap-handler"

export const GET = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const idFilter = req.query.id ? (Array.isArray(req.query.id) ? req.query.id : [req.query.id]) as string[] : null

  if (idFilter) {
    for (const orderId of idFilter) {
      await requireOrderBelongsToStore(req, storeId, orderId)
    }

    const orderModule = req.scope.resolve(Modules.ORDER)
    const [orders] = await orderModule.listAndCountOrders(
      { id: idFilter },
      { relations: ["items", "shipping_address", "billing_address", "shipping_methods"] }
    )

    res.json({ orders, count: orders.length, limit: orders.length, offset: 0 })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const offset = parseInt(req.query.offset as string) || 0
  const statusFilter = req.query.status
    ? (Array.isArray(req.query.status) ? req.query.status : [req.query.status]) as string[]
    : null
  const q = (req.query.q as string || "").trim().toLowerCase()
  const orderParam = (req.query.order as string) || "-created_at"

  const { data: storeWithProducts } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["products.id"],
  })

  const productIds = (storeWithProducts[0]?.products || []).map((p: any) => p.id)

  if (productIds.length === 0) {
    res.json({ orders: [], count: 0, limit, offset })
    return
  }

  const orderModule = req.scope.resolve(Modules.ORDER)

  const filters: any = {}
  if (statusFilter) {
    filters.status = statusFilter
  }

  const [allOrders] = await orderModule.listAndCountOrders(
    filters,
    {
      select: ["id", "display_id", "status", "currency_code", "created_at", "updated_at", "email", "total", "subtotal", "tax_total", "shipping_total", "discount_total"],
      relations: ["items"],
      take: 500,
      order: { created_at: "DESC" },
    }
  )

  let storeOrders = allOrders.filter((order: any) =>
    order.items?.some((item: any) => productIds.includes(item.product_id))
  )

  if (q) {
    storeOrders = storeOrders.filter((order: any) =>
      order.email?.toLowerCase().includes(q) ||
      String(order.display_id)?.includes(q)
    )
  }

  const desc = orderParam.startsWith("-")
  const sortField = desc ? orderParam.slice(1) : orderParam
  storeOrders.sort((a: any, b: any) => {
    const aVal = a[sortField] ?? ""
    const bVal = b[sortField] ?? ""
    if (aVal < bVal) return desc ? 1 : -1
    if (aVal > bVal) return desc ? -1 : 1
    return 0
  })

  const count = storeOrders.length
  const orders = storeOrders.slice(offset, offset + limit)

  res.json({ orders, count, limit, offset })
})
