import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { HttpTypes } from "@medusajs/framework/types"
import createVendorProductWorkflow from "../../../../../workflows/create-vendor-product"
import {
  updateProductsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  validateCategoriesAreLeaves,
  validateProductHasCategory,
  storeHasCategories,
} from "../helpers/category-helpers"
import { wrapHandler } from "../../helpers/wrap-handler"

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

async function verifyProductOwnership(
  req: AuthenticatedMedusaRequest,
  storeId: string,
  productIds: string[]
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithProducts } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["products.id"],
  })

  const storeProductIds = new Set((storeWithProducts[0]?.products || []).map((p: any) => p.id))
  for (const pid of productIds) {
    if (!storeProductIds.has(pid)) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Product ${pid} not found in this store`)
    }
  }
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

  const idFilter = req.query.id ? (Array.isArray(req.query.id) ? req.query.id : [req.query.id]) as string[] : null

  if (idFilter) {
    await verifyProductOwnership(req, storeId, idFilter)

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await query.graph({
      entity: "product",
      filters: { id: idFilter },
      fields: [
        "id", "title", "handle", "subtitle", "description",
        "status", "thumbnail", "created_at", "updated_at", "metadata",
        "categories.id", "categories.name",
        "images.*",
        "variants.id", "variants.title", "variants.sku", "variants.barcode",
        "variants.options", "variants.manage_inventory", "variants.allow_backorder",
        "variants.prices.*", "variants.images.*",
        "options.id", "options.title", "options.metadata", "options.values.*",
      ],
    })

    res.json({ products, count: products.length, limit: products.length, offset: 0 })
    return
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const offset = parseInt(req.query.offset as string) || 0
  const q = (req.query.q as string || "").trim().toLowerCase()
  const statusFilter = req.query.status
    ? (Array.isArray(req.query.status) ? req.query.status : [req.query.status]) as string[]
    : null
  const categoryIds = req.query.category_id
    ? (Array.isArray(req.query.category_id) ? req.query.category_id : [req.query.category_id]) as string[]
    : null
  const orderParam = (req.query.order as string) || "-created_at"

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithProducts } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: [
      "products.id",
      "products.title",
      "products.handle",
      "products.subtitle",
      "products.description",
      "products.status",
      "products.thumbnail",
      "products.created_at",
      "products.updated_at",
      "products.metadata",
      "products.images.*",
      "products.variants.id",
      "products.variants.title",
      "products.variants.prices.*",
      "products.categories.id",
      "products.categories.name",
    ],
  })

  let products = storeWithProducts[0]?.products || []

  if (statusFilter) {
    products = products.filter((p: any) => statusFilter.includes(p.status))
  }

  if (categoryIds) {
    products = products.filter((p: any) =>
      p.categories?.some((c: any) => categoryIds.includes(c.id))
    )
  }

  if (q) {
    products = products.filter((p: any) =>
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    )
  }

  const desc = orderParam.startsWith("-")
  const sortField = desc ? orderParam.slice(1) : orderParam
  products.sort((a: any, b: any) => {
    const aVal = a[sortField] ?? ""
    const bVal = b[sortField] ?? ""
    if (aVal < bVal) return desc ? 1 : -1
    if (aVal > bVal) return desc ? -1 : 1
    return 0
  })

  const count = products.length
  const paginated = products.slice(offset, offset + limit)

  res.json({ products: paginated, count, limit, offset })
})

export const POST = wrapHandler(async (
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

  const rawItems = Array.isArray(req.body) ? req.body : [req.body]
  const results: any[] = []

  for (const item of rawItems) {
    const categoryIds = item.category_ids as string[] | undefined
    await validateProductHasCategory(req, storeId, categoryIds)
    if (categoryIds && categoryIds.length > 0) {
      await validateCategoriesAreLeaves(req, storeId, categoryIds)
    }

    const { result } = await createVendorProductWorkflow(req.scope).run({
      input: {
        store_id: storeId,
        product: item,
      },
    })
    results.push(result.product)
  }

  res.status(201).json({ products: results })
})

export const PUT = wrapHandler(async (
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

  const rawItems = Array.isArray(req.body) ? req.body : [req.body]

  for (const item of rawItems) {
    if (!item.id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Each update item must have an 'id' field")
    }
  }

  const productIds = rawItems.map((item: any) => item.id)
  await verifyProductOwnership(req, storeId, productIds)

  for (const item of rawItems) {
    const categoryIds = item.category_ids as string[] | undefined
    if (categoryIds && categoryIds.length > 0) {
      await validateCategoriesAreLeaves(req, storeId, categoryIds)
    }
  }

  const skuQuantities: Record<string, number> = {}
  const cleanedItems = rawItems.map((item: any) => {
    if (!item.variants) return item
    const variants = item.variants.map((v: any) => {
      const { quantity, ...rest } = v
      if (v.sku && typeof quantity === "number") {
        skuQuantities[v.sku] = quantity
      }
      return rest
    })
    return { ...item, variants }
  })

  await updateProductsWorkflow(req.scope).run({
    input: {
      products: cleanedItems,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const skuEntries = Object.entries(skuQuantities)
  if (skuEntries.length > 0) {
    const inventoryModule = req.scope.resolve(Modules.INVENTORY)

    const { data: storeData } = await query.graph({
      entity: "store",
      filters: { id: storeId },
      fields: ["default_location_id"],
    })
    const locationId = (storeData[0] as any)?.default_location_id

    if (locationId) {
      const skus = skuEntries.map(([sku]) => sku)
      const [inventoryItems] = await inventoryModule.listAndCountInventoryItems(
        { sku: skus } as any,
        { relations: ["location_levels"], take: skus.length + 10 } as any
      )

      for (const [sku, quantity] of skuEntries) {
        const invItem = (inventoryItems as any[]).find((item: any) => item.sku === sku)
        if (!invItem) continue

        const levels = invItem.location_levels || []
        const existingLevel = levels.find((l: any) => l.location_id === locationId)

        if (existingLevel) {
          await inventoryModule.updateInventoryLevels([{
            inventory_item_id: invItem.id,
            location_id: locationId,
            id: existingLevel.id,
            stocked_quantity: quantity,
          }])
        } else {
          await inventoryModule.createInventoryLevels({
            inventory_item_id: invItem.id,
            location_id: locationId,
            stocked_quantity: quantity,
          })
        }
      }
    }
  }
  const { data: products } = await query.graph({
    entity: "product",
    filters: { id: productIds },
    fields: [
      "id", "title", "handle", "subtitle", "description", "status",
      "thumbnail", "created_at", "updated_at", "metadata",
      "images.*", "variants.id", "variants.title", "variants.sku",
      "variants.prices.*", "categories.id", "categories.name",
    ],
  })

  res.json({ products })
})

export const DELETE = wrapHandler(async (
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

  const { ids } = req.body as any

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "'ids' array is required")
  }

  await verifyProductOwnership(req, storeId, ids)

  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)

  for (const productId of ids) {
    await link.dismiss({
      [Modules.STORE]: { store_id: storeId },
      [Modules.PRODUCT]: { product_id: productId },
    })
  }

  await deleteProductsWorkflow(req.scope).run({
    input: { ids },
  })

  res.json({ deleted: ids })
})
