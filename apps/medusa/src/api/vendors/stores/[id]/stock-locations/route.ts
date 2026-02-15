import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess } from "../../helpers/verify-ownership"
import { wrapHandler } from "../../helpers/wrap-handler"
import { createStockLocationsWorkflow, updateStoresWorkflow, linkSalesChannelsToStockLocationWorkflow } from "@medusajs/medusa/core-flows"

export const GET = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
  const offset = parseInt(req.query.offset as string) || 0
  const q = (req.query.q as string || "").trim().toLowerCase()
  const orderParam = (req.query.order as string) || "name"
  const idFilter = req.query.id ? (Array.isArray(req.query.id) ? req.query.id : [req.query.id]) as string[] : null

  const { data: storeData } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["default_location_id"],
  })
  const defaultLocationId = (storeData[0] as any)?.default_location_id

  const stockLocationModule = req.scope.resolve(Modules.STOCK_LOCATION)
  const [allLocations] = await stockLocationModule.listAndCountStockLocations(
    idFilter ? { id: idFilter } : {},
    { relations: ["address"], take: 500 } as any
  )

  let items = (allLocations as any[]).map((loc: any) => ({
    ...loc,
    is_default: loc.id === defaultLocationId,
  }))

  if (q) {
    items = items.filter((loc: any) =>
      loc.name?.toLowerCase().includes(q) ||
      loc.address?.city?.toLowerCase().includes(q) ||
      loc.address?.country_code?.toLowerCase().includes(q)
    )
  }

  const desc = orderParam.startsWith("-")
  const sortField = desc ? orderParam.slice(1) : orderParam
  items.sort((a: any, b: any) => {
    const aVal = a[sortField] ?? ""
    const bVal = b[sortField] ?? ""
    if (aVal < bVal) return desc ? 1 : -1
    if (aVal > bVal) return desc ? -1 : 1
    return 0
  })

  const count = items.length
  const paginated = items.slice(offset, offset + limit)

  res.json({ stock_locations: paginated, count, limit, offset })
})

export const POST = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const { stock_locations: locationsInput, set_as_default } = req.body
  if (!locationsInput || !Array.isArray(locationsInput) || locationsInput.length === 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "stock_locations array is required")
  }

  const { result: created } = await createStockLocationsWorkflow(req.scope).run({
    input: {
      locations: locationsInput.map((loc: any) => ({
        name: loc.name,
        ...(loc.address && { address: loc.address }),
      })),
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  if (set_as_default && created.length > 0) {
    await updateStoresWorkflow(req.scope).run({
      input: {
        selector: { id: storeId },
        update: { default_location_id: created[0].id },
      },
    })
  }

  const { data: storeData } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["default_sales_channel_id"],
  })
  const salesChannelId = (storeData[0] as any)?.default_sales_channel_id

  for (const loc of created) {
    if (salesChannelId) {
      try {
        await linkSalesChannelsToStockLocationWorkflow(req.scope).run({
          input: { id: loc.id, add: [salesChannelId] },
        })
      } catch {}
    }
  }

  res.status(201).json({ stock_locations: created })
})

export const PUT = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const { stock_locations: updates } = req.body
  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "stock_locations array is required")
  }

  const stockLocationModule = req.scope.resolve(Modules.STOCK_LOCATION)
  const results: any[] = []

  for (const update of updates) {
    const { id, name, address } = update
    if (!id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Each stock location update must have an id")
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (address !== undefined) updateData.address = address

    const updated = await stockLocationModule.updateStockLocations(id, updateData)
    results.push(updated)
  }

  res.json({ stock_locations: results })
})

export const DELETE = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const { ids } = req.body
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "ids array is required")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: storeData } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["default_location_id"],
  })
  const defaultLocationId = (storeData[0] as any)?.default_location_id

  if (defaultLocationId && ids.includes(defaultLocationId)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Cannot delete the store's default location. Change the default first."
    )
  }

  const stockLocationModule = req.scope.resolve(Modules.STOCK_LOCATION)
  await stockLocationModule.deleteStockLocations(ids)

  res.json({ deleted: ids })
})
