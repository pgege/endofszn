import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  updateProductCategoriesWorkflow,
  deleteProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows"
import { getProductsOnCategory } from "../helpers/category-helpers"
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

async function verifyCategoryOwnership(
  req: AuthenticatedMedusaRequest,
  storeId: string,
  categoryIds: string[]
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithCategories } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["product_categories.id"],
  })

  const storeCategoryIds = new Set(
    (storeWithCategories[0]?.product_categories || []).map((c: any) => c.id)
  )

  for (const catId of categoryIds) {
    if (!storeCategoryIds.has(catId)) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Category ${catId} not found in this store`)
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
    await verifyCategoryOwnership(req, storeId, idFilter)

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: categories } = await query.graph({
      entity: "product_category",
      filters: { id: idFilter },
      fields: [
        "*",
        "parent_category.*",
        "category_children.*",
        "products.*",
        "products.variants.*",
        "products.images.*",
      ],
    })

    res.json({ categories, count: categories.length, limit: categories.length, offset: 0 })
    return
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 1000, 1000)
  const offset = parseInt(req.query.offset as string) || 0
  const q = (req.query.q as string || "").trim().toLowerCase()
  const orderParam = (req.query.order as string) || "rank"

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithCategories } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["product_categories.id"],
  })

  const categoryIds = (storeWithCategories[0]?.product_categories || []).map((c: any) => c.id)

  if (categoryIds.length === 0) {
    res.json({ categories: [], count: 0, limit, offset })
    return
  }

  const { data: allCategories } = await query.graph({
    entity: "product_category",
    filters: { id: categoryIds },
    fields: [
      "id", "name", "description", "handle", "is_active", "is_internal", "rank", "created_at",
      "parent_category.id", "parent_category.name",
      "category_children.id", "category_children.name",
    ],
  })

  let categories = allCategories as any[]

  if (q) {
    categories = categories.filter((c: any) =>
      c.name?.toLowerCase().includes(q) || c.handle?.toLowerCase().includes(q)
    )
  }

  const desc = orderParam.startsWith("-")
  const sortField = desc ? orderParam.slice(1) : orderParam
  categories.sort((a: any, b: any) => {
    const aVal = a[sortField] ?? ""
    const bVal = b[sortField] ?? ""
    if (aVal < bVal) return desc ? 1 : -1
    if (aVal > bVal) return desc ? -1 : 1
    return 0
  })

  const count = categories.length
  const paginated = categories.slice(offset, offset + limit)

  res.json({ categories: paginated, count, limit, offset })
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
    const { name, description, handle, parent_category_id, is_active } = item

    if (!name) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Category name is required")
    }

    if (parent_category_id) {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: storeWithCategories } = await query.graph({
        entity: "store",
        filters: { id: storeId },
        fields: ["product_categories.id"],
      })
      const storeCategoryIds = new Set(
        (storeWithCategories[0]?.product_categories || []).map((c: any) => c.id)
      )
      if (!storeCategoryIds.has(parent_category_id)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Parent category does not belong to this store")
      }

      const productsOnParent = await getProductsOnCategory(req, parent_category_id)
      if (productsOnParent.length > 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Cannot add subcategory to a category that has products. Move products first. Products on parent: ${productsOnParent.map((p: any) => p.title).join(", ")}`
        )
      }
    }

    const categoryHandle =
      handle ||
      `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${storeId.replace("store_", "").slice(0, 6)}-${Math.random().toString(36).slice(2, 6)}`

    const { result } = await createProductCategoriesWorkflow(req.scope).run({
      input: {
        product_categories: [
          {
            name,
            description,
            handle: categoryHandle,
            parent_category_id,
            is_active: is_active !== false,
            is_internal: false,
          },
        ],
      },
    })

    const createdCategory = result[0]

    const remoteLink = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK)
    await remoteLink.create({
      [Modules.STORE]: { store_id: storeId },
      [Modules.PRODUCT]: { product_category_id: createdCategory.id },
    })

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: categories } = await query.graph({
      entity: "product_category",
      filters: { id: createdCategory.id },
      fields: ["*", "parent_category.*", "category_children.*"],
    })

    results.push(categories[0])
  }

  res.status(201).json({ categories: results })
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

  const categoryIds = rawItems.map((item: any) => item.id)
  await verifyCategoryOwnership(req, storeId, categoryIds)

  for (const item of rawItems) {
    if (item.parent_category_id) {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: storeWithCategories } = await query.graph({
        entity: "store",
        filters: { id: storeId },
        fields: ["product_categories.id"],
      })
      const storeCategoryIds = new Set(
        (storeWithCategories[0]?.product_categories || []).map((c: any) => c.id)
      )
      if (!storeCategoryIds.has(item.parent_category_id)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Parent category does not belong to this store")
      }
      if (item.parent_category_id === item.id) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Category cannot be its own parent")
      }
    }
  }

  const results: any[] = []

  for (const item of rawItems) {
    const { id, name, description, handle, parent_category_id, is_active } = item
    const update: any = {}
    if (name !== undefined) update.name = name
    if (description !== undefined) update.description = description
    if (handle !== undefined) update.handle = handle
    if (parent_category_id !== undefined) update.parent_category_id = parent_category_id
    if (is_active !== undefined) update.is_active = is_active

    await updateProductCategoriesWorkflow(req.scope).run({
      input: { selector: { id }, update },
    })

    results.push(id)
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: categories } = await query.graph({
    entity: "product_category",
    filters: { id: categoryIds },
    fields: ["*", "parent_category.*", "category_children.*"],
  })

  res.json({ categories })
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

  await verifyCategoryOwnership(req, storeId, ids)

  await deleteProductCategoriesWorkflow(req.scope).run({
    input: ids,
  })

  res.json({ deleted: ids })
})
