import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess, requireMetadataOwnership } from "../../helpers/verify-ownership"
import { wrapHandler } from "../../helpers/wrap-handler"

export const GET = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const idFilter = req.query.id ? (Array.isArray(req.query.id) ? req.query.id : [req.query.id]) as string[] : null

  if (idFilter) {
    const promotionModule = req.scope.resolve(Modules.PROMOTION)
    const [promotions] = await promotionModule.listAndCountPromotions(
      { id: idFilter },
      { relations: ["rules", "application_method"] }
    )
    for (const promotion of promotions) {
      requireMetadataOwnership(promotion, storeId, "Promotion")
    }

    res.json({ promotions, count: promotions.length, limit: promotions.length, offset: 0 })
    return
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const offset = parseInt(req.query.offset as string) || 0
  const q = (req.query.q as string || "").trim().toLowerCase()
  const orderParam = (req.query.order as string) || "-created_at"

  const promotionModule = req.scope.resolve(Modules.PROMOTION)

  const [allPromotions] = await promotionModule.listAndCountPromotions(
    { metadata: { store_id: storeId } } as any,
    {
      select: ["id", "code", "type", "status", "is_automatic", "created_at", "updated_at"],
      relations: ["rules", "application_method"],
      order: { created_at: "DESC" },
    }
  )

  let promotions = allPromotions as any[]

  if (q) {
    promotions = promotions.filter((p: any) =>
      p.code?.toLowerCase().includes(q)
    )
  }

  const desc = orderParam.startsWith("-")
  const sortField = desc ? orderParam.slice(1) : orderParam
  promotions.sort((a: any, b: any) => {
    const aVal = a[sortField] ?? ""
    const bVal = b[sortField] ?? ""
    if (aVal < bVal) return desc ? 1 : -1
    if (aVal > bVal) return desc ? -1 : 1
    return 0
  })

  const count = promotions.length
  const paginated = promotions.slice(offset, offset + limit)

  res.json({ promotions: paginated, count, limit, offset })
})

export const POST = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const promotionModule = req.scope.resolve(Modules.PROMOTION)

  const rawItems = Array.isArray(req.body) ? req.body : [req.body]
  const items = rawItems.map((item: any) => ({
    ...item,
    metadata: { ...(item.metadata || {}), store_id: storeId },
  }))

  const promotions = await promotionModule.createPromotions(items)
  const result = Array.isArray(promotions) ? promotions : [promotions]
  res.status(201).json({ promotions: result })
})

export const PUT = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const promotionModule = req.scope.resolve(Modules.PROMOTION)

  const rawItems = Array.isArray(req.body) ? req.body : [req.body]

  for (const item of rawItems) {
    if (!item.id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Each update item must have an 'id' field")
    }
    const existing = await promotionModule.retrievePromotion(item.id) as any
    if (existing?.metadata?.store_id !== storeId) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Promotion ${item.id} does not belong to this store`)
    }
  }

  const updates = rawItems.map((item: any) => ({
    ...item,
    metadata: { ...(item.metadata || {}), store_id: storeId },
  }))

  const result = await promotionModule.updatePromotions(updates)
  const promotions = Array.isArray(result) ? result : [result]
  res.json({ promotions })
})

export const DELETE = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const promotionModule = req.scope.resolve(Modules.PROMOTION)
  const { ids } = req.body as any

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "'ids' array is required")
  }

  for (const id of ids) {
    const existing = await promotionModule.retrievePromotion(id) as any
    if (existing?.metadata?.store_id !== storeId) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Promotion ${id} does not belong to this store`)
    }
  }

  await promotionModule.deletePromotions(ids)
  res.json({ deleted: ids })
})
