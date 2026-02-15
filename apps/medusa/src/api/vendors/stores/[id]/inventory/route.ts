import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { requireStoreAccess, getStoreProductIds } from "../../helpers/verify-ownership"
import { wrapHandler } from "../../helpers/wrap-handler"

export const GET = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const idFilter = req.query.id ? (Array.isArray(req.query.id) ? req.query.id : [req.query.id]) as string[] : null

  if (idFilter) {
    const inventoryModule = req.scope.resolve(Modules.INVENTORY)
    const [items] = await (inventoryModule as any).listAndCountInventoryItems(
      { id: idFilter },
      { relations: ["location_levels"] }
    )

    res.json({ inventory_items: items, count: items.length, limit: items.length, offset: 0 })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
  const offset = parseInt(req.query.offset as string) || 0
  const q = (req.query.q as string || "").trim().toLowerCase()
  const orderParam = (req.query.order as string) || "product_title"

  const { data: storeWithProducts } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: [
      "products.id",
      "products.title",
      "products.thumbnail",
      "products.variants.id",
      "products.variants.title",
      "products.variants.sku",
      "products.variants.manage_inventory",
      "products.variants.allow_backorder",
    ],
  })

  const products = storeWithProducts[0]?.products || []
  const items: any[] = []
  const allVariantIds: string[] = []

  for (const product of products as any[]) {
    for (const variant of product?.variants || []) {
      allVariantIds.push(variant.id)
      items.push({
        product_id: product?.id,
        product_title: product?.title,
        product_thumbnail: product?.thumbnail,
        variant_id: variant.id,
        variant_title: variant.title,
        sku: variant.sku,
        manage_inventory: variant.manage_inventory ?? false,
        allow_backorder: variant.allow_backorder ?? false,
        stocked_quantity: 0,
        reserved_quantity: 0,
        available_quantity: 0,
      })
    }
  }

  if (allVariantIds.length > 0) {
    const inventoryModule = req.scope.resolve(Modules.INVENTORY)
    const variantToInvId = new Map<string, string>()

    try {
      const { data: links } = await query.graph({
        entity: "product_variant_inventory_item",
        filters: { variant_id: allVariantIds },
        fields: ["variant_id", "inventory_item_id"],
      })
      for (const link of links as any[]) {
        if (link.inventory_item_id) {
          variantToInvId.set(link.variant_id, link.inventory_item_id)
        }
      }
    } catch {
      const skus = items.map((i: any) => i.sku).filter(Boolean) as string[]
      if (skus.length > 0) {
        const [invItems] = await inventoryModule.listAndCountInventoryItems(
          { sku: skus } as any,
          { take: skus.length + 50 } as any
        )
        const skuToInvId = new Map<string, string>()
        for (const inv of invItems) {
          if (inv.sku) skuToInvId.set(inv.sku, inv.id)
        }
        for (const item of items) {
          if (item.sku) {
            const invId = skuToInvId.get(item.sku)
            if (invId) variantToInvId.set(item.variant_id, invId)
          }
        }
      }
    }

    const invIds = [...new Set(variantToInvId.values())]
    if (invIds.length > 0) {
      const [inventoryItems] = await inventoryModule.listAndCountInventoryItems(
        { id: invIds },
        { relations: ["location_levels"], take: invIds.length + 50 } as any
      )
      const invMap = new Map<string, any>()
      for (const inv of inventoryItems) invMap.set(inv.id, inv)

      for (const item of items) {
        const invId = variantToInvId.get(item.variant_id)
        if (!invId) continue
        const inv = invMap.get(invId)
        if (!inv) continue
        item.inventory_item_id = inv.id
        const levels = inv.location_levels || []
        item.stocked_quantity = levels.reduce((sum: number, l: any) => sum + (l.stocked_quantity || 0), 0)
        item.reserved_quantity = levels.reduce((sum: number, l: any) => sum + (l.reserved_quantity || 0), 0)
        item.available_quantity = item.stocked_quantity - item.reserved_quantity
      }
    }
  }

  let filteredItems = items as any[]

  if (q) {
    filteredItems = filteredItems.filter((item: any) =>
      item.product_title?.toLowerCase().includes(q) ||
      item.variant_title?.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q)
    )
  }

  const desc = orderParam.startsWith("-")
  const sortField = desc ? orderParam.slice(1) : orderParam
  filteredItems.sort((a: any, b: any) => {
    const aVal = a[sortField] ?? ""
    const bVal = b[sortField] ?? ""
    if (aVal < bVal) return desc ? 1 : -1
    if (aVal > bVal) return desc ? -1 : 1
    return 0
  })

  const count = filteredItems.length
  const paginated = filteredItems.slice(offset, offset + limit)

  res.json({ inventory_items: paginated, count, limit, offset })
})

export const PUT = wrapHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const storeId = req.params.id
  await requireStoreAccess(req, storeId)

  const rawItems = Array.isArray(req.body) ? req.body : [req.body]
  const inventoryModule = req.scope.resolve(Modules.INVENTORY)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeData } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["products.variants.id", "products.variants.sku", "default_location_id"],
  })

  const defaultLocationId = (storeData[0] as any)?.default_location_id

  const storeVariantIds = new Set<string>()
  const storeSKUs = new Set<string>()
  for (const product of storeData[0]?.products || []) {
    for (const variant of (product as any).variants || []) {
      storeVariantIds.add(variant.id)
      if (variant.sku) storeSKUs.add(variant.sku)
    }
  }

  const variantIdsToResolve = rawItems
    .filter((u: any) => !u.id && u.variant_id)
    .map((u: any) => u.variant_id as string)

  const variantToInventoryId = new Map<string, string>()

  if (variantIdsToResolve.length > 0) {
    for (const vid of variantIdsToResolve) {
      if (!storeVariantIds.has(vid)) {
        throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Variant ${vid} does not belong to this store`)
      }
    }

    try {
      const { data: links } = await query.graph({
        entity: "product_variant_inventory_item",
        filters: { variant_id: variantIdsToResolve },
        fields: ["variant_id", "inventory_item_id"],
      })
      for (const link of links as any[]) {
        if (link.inventory_item_id) {
          variantToInventoryId.set(link.variant_id, link.inventory_item_id)
        }
      }
    } catch {
      const variantSkus = new Map<string, string>()
      for (const product of storeData[0]?.products || []) {
        for (const variant of (product as any).variants || []) {
          if (variant.sku && variantIdsToResolve.includes(variant.id)) {
            variantSkus.set(variant.id, variant.sku)
          }
        }
      }
      const skusToFind = [...variantSkus.values()]
      if (skusToFind.length > 0) {
        const [invItems] = await inventoryModule.listAndCountInventoryItems(
          { sku: skusToFind } as any,
          { take: skusToFind.length + 50 } as any
        )
        const skuToInvId = new Map<string, string>()
        for (const inv of invItems) {
          if (inv.sku) skuToInvId.set(inv.sku, inv.id)
        }
        for (const [vid, sku] of variantSkus) {
          const invId = skuToInvId.get(sku)
          if (invId) variantToInventoryId.set(vid, invId)
        }
      }
    }
  }

  const resolvedItems = rawItems.map((u: any) => {
    if (u.id) return u
    if (u.variant_id) {
      const invId = variantToInventoryId.get(u.variant_id)
      if (!invId) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Could not resolve inventory item for variant ${u.variant_id}. Ensure the variant has inventory tracking enabled.`
        )
      }
      return { ...u, id: invId }
    }
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Each update must have either 'id' (inventory_item_id) or 'variant_id'"
    )
  })

  const itemIds = resolvedItems.map((u: any) => u.id)

  const [allItems] = await inventoryModule.listAndCountInventoryItems(
    { id: itemIds },
    { relations: ["location_levels"] }
  ) as any

  const itemMap = new Map<string, any>()
  for (const item of allItems) {
    if (item.sku && !storeSKUs.has(item.sku)) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Inventory item ${item.id} does not belong to this store`)
    }
    itemMap.set(item.id, item)
  }

  const results: any[] = []

  for (const update of resolvedItems) {
    const { id, stocked_quantity, location_id } = update

    const item = itemMap.get(id)
    if (!item) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Inventory item ${id} not found`)
    }

    const levels = item.location_levels || []
    const targetLocationId = location_id || levels[0]?.location_id || defaultLocationId

    if (!targetLocationId) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `No location found for inventory item ${id}`)
    }

    const existingLevel = levels.find((l: any) => l.location_id === targetLocationId)

    if (existingLevel) {
      await inventoryModule.updateInventoryLevels([{
        inventory_item_id: id,
        location_id: targetLocationId,
        id: existingLevel.id,
        stocked_quantity: stocked_quantity ?? existingLevel.stocked_quantity,
      }])
    } else {
      await inventoryModule.createInventoryLevels({
        inventory_item_id: id,
        location_id: targetLocationId,
        stocked_quantity: stocked_quantity ?? 0,
      })
    }

    const updated = await inventoryModule.retrieveInventoryItem(id, {
      relations: ["location_levels"],
    })
    results.push(updated)
  }

  res.json({ inventory_items: results })
})
