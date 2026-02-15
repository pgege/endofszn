import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess, getStoreProductIds } from "../../helpers/verify-ownership"
import { wrapHandler } from "../../helpers/wrap-handler"

export const GET = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const idFilter = req.query.id ? (Array.isArray(req.query.id) ? req.query.id : [req.query.id]) as string[] : null

  if (idFilter) {
    const productIds = await getStoreProductIds(req, storeId)
    const customerModule = req.scope.resolve(Modules.CUSTOMER)
    const orderModule = req.scope.resolve(Modules.ORDER)

    const [allOrders] = await orderModule.listAndCountOrders(
      { customer_id: idFilter } as any,
      { select: ["id", "display_id", "status", "total", "currency_code", "created_at", "customer_id", "items.product_id"], relations: ["items"], take: 500 }
    )

    const ordersByCustomer = new Map<string, any[]>()
    for (const order of allOrders) {
      const belongsToStore = order.items?.some((item: any) => productIds.includes(item.product_id))
      if (!belongsToStore || !order.customer_id) continue
      if (!ordersByCustomer.has(order.customer_id)) ordersByCustomer.set(order.customer_id, [])
      ordersByCustomer.get(order.customer_id)!.push(order)
    }

    const validCustomerIds = Array.from(ordersByCustomer.keys())
    if (validCustomerIds.length === 0) {
      res.json({ customers: [], count: 0, limit: 0, offset: 0 })
      return
    }

    const [customerList] = await customerModule.listAndCountCustomers(
      { id: validCustomerIds },
      { relations: ["addresses"] }
    )
    const customers = customerList.map((c: any) => ({ ...c, orders: ordersByCustomer.get(c.id) || [] }))

    res.json({ customers, count: customers.length, limit: customers.length, offset: 0 })
    return
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const offset = parseInt(req.query.offset as string) || 0
  const q = (req.query.q as string || "").trim().toLowerCase()
  const orderParam = (req.query.order as string) || "-created_at"

  const productIds = await getStoreProductIds(req, storeId)
  if (productIds.length === 0) {
    res.json({ customers: [], count: 0, limit, offset })
    return
  }

  const orderModule = req.scope.resolve(Modules.ORDER)
  const [orders] = await orderModule.listAndCountOrders(
    {} as any,
    { select: ["id", "customer_id", "items.product_id"], relations: ["items"], take: 1000 }
  )

  const storeCustomerIds = new Set<string>()
  for (const order of orders) {
    const belongsToStore = order.items?.some((item: any) => productIds.includes(item.product_id))
    if (belongsToStore && order.customer_id) {
      storeCustomerIds.add(order.customer_id)
    }
  }

  if (storeCustomerIds.size === 0) {
    res.json({ customers: [], count: 0, limit, offset })
    return
  }

  const customerModule = req.scope.resolve(Modules.CUSTOMER)

  const filters: any = { id: Array.from(storeCustomerIds) }
  if (q) {
    filters.$or = [
      { first_name: { $ilike: `%${q}%` } },
      { last_name: { $ilike: `%${q}%` } },
      { email: { $ilike: `%${q}%` } },
    ]
  }

  const desc = orderParam.startsWith("-")
  const sortField = desc ? orderParam.slice(1) : orderParam

  const [customers, count] = await customerModule.listAndCountCustomers(
    filters,
    {
      select: ["id", "email", "first_name", "last_name", "phone", "has_account", "created_at", "updated_at"],
      take: limit,
      skip: offset,
      order: { [sortField]: desc ? "DESC" : "ASC" },
    }
  )

  res.json({ customers, count, limit, offset })
})
