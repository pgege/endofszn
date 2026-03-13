import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

function normalizeCollection(raw: any): any {
  const products = raw.products || []
  const firstProductThumb = products.find((p: any) => p.thumbnail)?.thumbnail ?? null

  return {
    id: raw.id,
    title: raw.title,
    handle: raw.handle,
    description: raw.description ?? null,
    imageSrc: firstProductThumb,
    metadata: raw.metadata ?? null,
    created_at: raw.created_at ?? "",
    updated_at: raw.updated_at ?? "",
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeId = req.params.id

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const offset = parseInt(req.query.offset as string) || 0
  const q = (req.query.q as string || "").trim().toLowerCase()
  const orderParam = (req.query.order as string) || "-created_at"

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithCollections } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: [
      "product_collections.id",
      "product_collections.title",
      "product_collections.handle",
      "product_collections.description",
      "product_collections.metadata",
      "product_collections.created_at",
      "product_collections.updated_at",
      "product_collections.products.thumbnail",
    ],
  })

  const rawCollections = (storeWithCollections[0]?.product_collections || []) as any[]
  const seen = new Set<string>()
  let collections = rawCollections.filter((c: any) => {
    if (seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })

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

  res.json({
    collections: paginated.map(normalizeCollection),
    count,
    limit,
    offset,
  })
}
