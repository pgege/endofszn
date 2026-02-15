import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { CATEGORY_TEMPLATES } from "./data"
import { wrapHandler } from "../../../helpers/wrap-handler"

async function verifyStoreOwnership(
  req: AuthenticatedMedusaRequest,
  storeId: string
): Promise<boolean> {
  const vendorId = req.auth_context?.actor_id
  if (!vendorId) return false

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: vendorWithStores } = await query.graph({
    entity: "vendor_admin",
    filters: { id: vendorId },
    fields: ["stores.id"],
  })

  const stores = vendorWithStores[0]?.stores || []
  return stores.some((store: any) => store.id === storeId)
}

export const GET = wrapHandler(async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const vendorId = req.auth_context?.actor_id
  const storeId = req.params.id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const isOwner = await verifyStoreOwnership(req, storeId)
  if (!isOwner) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Forbidden")
  }

  let templates = CATEGORY_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    structure: t.structure,
  }))

  const idFilter = req.query.id
  if (idFilter) {
    const ids = Array.isArray(idFilter) ? idFilter as string[] : [idFilter as string]
    templates = templates.filter((t) => ids.includes(t.id))
  }

  const q = req.query.q as string | undefined
  if (q) {
    const lower = q.toLowerCase()
    templates = templates.filter((t) =>
      t.name.toLowerCase().includes(lower) || t.description?.toLowerCase().includes(lower)
    )
  }

  const order = req.query.order as string | undefined
  if (order) {
    const desc = order.startsWith('-')
    const field = desc ? order.slice(1) : order
    templates.sort((a: any, b: any) => {
      const aVal = a[field] ?? ''
      const bVal = b[field] ?? ''
      const cmp = String(aVal).localeCompare(String(bVal))
      return desc ? -cmp : cmp
    })
  }

  const total = templates.length
  const limit = parseInt(req.query.limit as string) || 50
  const offset = parseInt(req.query.offset as string) || 0
  templates = templates.slice(offset, offset + limit)

  res.json({
    templates,
    count: total,
    limit,
    offset,
  })
})
