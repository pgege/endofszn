import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess, requireMetadataOwnership } from "../../helpers/verify-ownership"
import { wrapHandler } from "../../helpers/wrap-handler"

export const GET = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const idFilter = req.query.id ? (Array.isArray(req.query.id) ? req.query.id : [req.query.id]) as string[] : null

  if (idFilter) {
    const productModule = req.scope.resolve(Modules.PRODUCT)
    const [collections] = await productModule.listAndCountProductCollections(
      { id: idFilter },
      { relations: ["products"] }
    )
    for (const collection of collections) {
      requireMetadataOwnership(collection, storeId, "Collection")
    }

    res.json({ collections, count: collections.length, limit: collections.length, offset: 0 })
    return
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const offset = parseInt(req.query.offset as string) || 0
  const q = (req.query.q as string || "").trim().toLowerCase()
  const orderParam = (req.query.order as string) || "-created_at"

  const productModule = req.scope.resolve(Modules.PRODUCT)

  const [allCollections] = await productModule.listAndCountProductCollections(
    { metadata: { store_id: storeId } } as any,
    {
      select: ["id", "title", "handle", "created_at", "updated_at"],
      relations: ["products"],
      order: { created_at: "DESC" },
    }
  )

  let collections = allCollections as any[]

  if (q) {
    collections = collections.filter((c: any) =>
      c.title?.toLowerCase().includes(q) || c.handle?.toLowerCase().includes(q)
    )
  }

  const desc = orderParam.startsWith("-")
  const sortField = desc ? orderParam.slice(1) : orderParam
  collections.sort((a: any, b: any) => {
    const aVal = a[sortField] ?? ""
    const bVal = b[sortField] ?? ""
    if (aVal < bVal) return desc ? 1 : -1
    if (aVal > bVal) return desc ? -1 : 1
    return 0
  })

  const count = collections.length
  const paginated = collections.slice(offset, offset + limit)

  res.json({ collections: paginated, count, limit, offset })
})

export const POST = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const productModule = req.scope.resolve(Modules.PRODUCT)

  const rawItems = Array.isArray(req.body) ? req.body : [req.body]

  const results = await Promise.all(rawItems.map(async (item: any) => {
    const collection = await productModule.createProductCollections({
      ...item,
      metadata: { ...(item.metadata || {}), store_id: storeId },
    })
    return Array.isArray(collection) ? collection[0] : collection
  }))

  res.status(201).json({ collections: results })
})

export const PUT = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const productModule = req.scope.resolve(Modules.PRODUCT)

  const rawItems = Array.isArray(req.body) ? req.body : [req.body]
  const results: any[] = []

  for (const item of rawItems) {
    if (!item.id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Each update item must have an 'id' field")
    }
    const existing = await productModule.retrieveProductCollection(item.id)
    requireMetadataOwnership(existing, storeId, "Collection")

    const { id, ...data } = item
    const result = await productModule.updateProductCollections(id, {
      ...data,
      metadata: { ...(data.metadata || {}), store_id: storeId },
    })
    results.push(Array.isArray(result) ? result[0] : result)
  }

  res.json({ collections: results })
})

export const DELETE = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const productModule = req.scope.resolve(Modules.PRODUCT)
  const { ids } = req.body as any

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "'ids' array is required")
  }

  const [existing] = await productModule.listAndCountProductCollections(
    { id: ids },
    { select: ["id", "metadata"] }
  )
  for (const collection of existing) {
    requireMetadataOwnership(collection, storeId, "Collection")
  }

  await productModule.deleteProductCollections(ids)

  res.json({ deleted: ids })
})
