import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess } from "../../helpers/verify-ownership"
import { wrapHandler } from "../../helpers/wrap-handler"

function requirePriceListOwnership(priceList: any, storeId: string) {
  const plRules = priceList.price_list_rules || []
  const hasStoreRule = plRules.some(
    (r: any) => r.attribute === "store_id" && r.value?.includes(storeId)
  )
  if (!hasStoreRule) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Price list does not belong to this store`)
  }
}

export const GET = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const idFilter = req.query.id ? (Array.isArray(req.query.id) ? req.query.id : [req.query.id]) as string[] : null

  if (idFilter) {
    const pricingModule = req.scope.resolve(Modules.PRICING)
    const [priceLists] = await pricingModule.listAndCountPriceLists(
      { id: idFilter },
      { relations: ["prices", "price_list_rules"] }
    )
    for (const priceList of priceLists) {
      requirePriceListOwnership(priceList, storeId)
    }

    res.json({ price_lists: priceLists, count: priceLists.length, limit: priceLists.length, offset: 0 })
    return
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const offset = parseInt(req.query.offset as string) || 0
  const q = (req.query.q as string || "").trim().toLowerCase()
  const orderParam = (req.query.order as string) || "-created_at"

  const pricingModule = req.scope.resolve(Modules.PRICING)

  const [allPriceLists] = await pricingModule.listAndCountPriceLists(
    {},
    {
      select: ["id", "title", "description", "status", "type", "starts_at", "ends_at", "created_at", "rules_count"],
      relations: ["price_list_rules"],
      order: { created_at: "DESC" },
    }
  )

  let storePriceLists = allPriceLists.filter((pl: any) => {
    const plRules = pl.price_list_rules || []
    return plRules.some((r: any) => r.attribute === "store_id" && r.value?.includes(storeId))
  }) as any[]

  if (q) {
    storePriceLists = storePriceLists.filter((pl: any) =>
      pl.title?.toLowerCase().includes(q) || pl.description?.toLowerCase().includes(q)
    )
  }

  const desc = orderParam.startsWith("-")
  const sortField = desc ? orderParam.slice(1) : orderParam
  storePriceLists.sort((a: any, b: any) => {
    const aVal = a[sortField] ?? ""
    const bVal = b[sortField] ?? ""
    if (aVal < bVal) return desc ? 1 : -1
    if (aVal > bVal) return desc ? -1 : 1
    return 0
  })

  const count = storePriceLists.length
  const priceLists = storePriceLists.slice(offset, offset + limit)

  res.json({ price_lists: priceLists, count, limit, offset })
})

export const POST = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const pricingModule = req.scope.resolve(Modules.PRICING)

  const rawItems = Array.isArray(req.body) ? req.body : [req.body]
  const items = rawItems.map((item: any) => ({
    ...item,
    rules: { ...(item.rules || {}), store_id: [storeId] },
  }))

  const priceLists = await pricingModule.createPriceLists(items)
  const result = Array.isArray(priceLists) ? priceLists : [priceLists]
  res.status(201).json({ price_lists: result })
})

export const PUT = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const pricingModule = req.scope.resolve(Modules.PRICING)

  const rawItems = Array.isArray(req.body) ? req.body : [req.body]

  for (const item of rawItems) {
    if (!item.id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Each update item must have an 'id' field")
    }
    const existing = await pricingModule.retrievePriceList(item.id, {
      relations: ["price_list_rules"],
    })
    requirePriceListOwnership(existing, storeId)
  }

  const updates = rawItems.map((item: any) => ({
    ...item,
    rules: { ...(item.rules || {}), store_id: [storeId] },
  }))

  const result = await pricingModule.updatePriceLists(updates)
  const priceLists = Array.isArray(result) ? result : [result]
  res.json({ price_lists: priceLists })
})

export const DELETE = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const pricingModule = req.scope.resolve(Modules.PRICING)
  const { ids } = req.body as any

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "'ids' array is required")
  }

  for (const id of ids) {
    const existing = await pricingModule.retrievePriceList(id, {
      relations: ["price_list_rules"],
    })
    requirePriceListOwnership(existing, storeId)
  }

  await pricingModule.deletePriceLists(ids)
  res.json({ deleted: ids })
})
