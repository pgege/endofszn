import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess, requireMetadataOwnership } from "../../helpers/verify-ownership"
import { wrapHandler } from "../../helpers/wrap-handler"

export const GET = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const idFilter = req.query.id ? (Array.isArray(req.query.id) ? req.query.id : [req.query.id]) as string[] : null

  if (idFilter) {
    const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT)
    const [shippingOptions] = await fulfillmentModule.listAndCountShippingOptions(
      { id: idFilter },
      { relations: ["rules", "type"] }
    )
    for (const option of shippingOptions) {
      requireMetadataOwnership(option, storeId, "Shipping option")
    }

    res.json({ shipping_options: shippingOptions, count: shippingOptions.length, limit: shippingOptions.length, offset: 0 })
    return
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const offset = parseInt(req.query.offset as string) || 0
  const q = (req.query.q as string || "").trim().toLowerCase()
  const orderParam = (req.query.order as string) || "-created_at"

  const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT)

  const [allOptions] = await fulfillmentModule.listAndCountShippingOptions(
    { metadata: { store_id: storeId } } as any,
    {
      select: ["id", "name", "price_type", "data", "metadata", "created_at", "updated_at"],
      relations: ["rules", "type"],
    }
  )

  let options = allOptions as any[]

  if (q) {
    options = options.filter((o: any) =>
      o.name?.toLowerCase().includes(q)
    )
  }

  const desc = orderParam.startsWith("-")
  const sortField = desc ? orderParam.slice(1) : orderParam
  options.sort((a: any, b: any) => {
    const aVal = a[sortField] ?? ""
    const bVal = b[sortField] ?? ""
    if (aVal < bVal) return desc ? 1 : -1
    if (aVal > bVal) return desc ? -1 : 1
    return 0
  })

  const count = options.length
  const paginated = options.slice(offset, offset + limit)

  res.json({ shipping_options: paginated, count, limit, offset })
})

export const POST = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT)

  const rawItems = Array.isArray(req.body) ? req.body : [req.body]

  const results = await Promise.all(rawItems.map(async (item: any) => {
    const data = {
      ...item,
      metadata: { ...(item.metadata || {}), store_id: storeId },
    }
    const option = await fulfillmentModule.createShippingOptions(data)
    return Array.isArray(option) ? option[0] : option
  }))

  res.status(201).json({ shipping_options: results })
})

export const PUT = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT)

  const rawItems = Array.isArray(req.body) ? req.body : [req.body]
  const results: any[] = []

  for (const item of rawItems) {
    if (!item.id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Each update item must have an 'id' field")
    }
    const existing = await fulfillmentModule.retrieveShippingOption(item.id)
    requireMetadataOwnership(existing, storeId, "Shipping option")

    const { id, ...data } = item
    const result = await fulfillmentModule.updateShippingOptions(id, {
      ...data,
      metadata: { ...(data.metadata || {}), store_id: storeId },
    })
    results.push(Array.isArray(result) ? result[0] : result)
  }

  res.json({ shipping_options: results })
})

export const DELETE = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT)
  const { ids } = req.body as any

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "'ids' array is required")
  }

  const [existing] = await fulfillmentModule.listAndCountShippingOptions(
    { id: ids },
    { select: ["id", "metadata"] }
  )
  for (const option of existing) {
    requireMetadataOwnership(option, storeId, "Shipping option")
  }

  await fulfillmentModule.deleteShippingOptions(ids)

  res.json({ deleted: ids })
})
