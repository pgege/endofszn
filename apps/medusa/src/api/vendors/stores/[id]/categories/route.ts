import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"
import { getProductsOnCategory } from "../helpers/category-helpers"

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

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const vendorId = req.auth_context?.actor_id
  const storeId = req.params.id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const isOwner = await verifyStoreOwnership(req, storeId)
  if (!isOwner) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Forbidden")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithCategories } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["product_categories.id"],
  })

  const categoryIds = (storeWithCategories[0]?.product_categories || []).map((c: any) => c.id)

  if (categoryIds.length === 0) {
    res.json({ categories: [] })
    return
  }

  const { data: categories } = await query.graph({
    entity: "product_category",
    filters: { id: categoryIds },
    fields: [
      "id",
      "name",
      "description",
      "handle",
      "is_active",
      "is_internal",
      "rank",
      "parent_category.id",
      "parent_category.name",
      "category_children.id",
      "category_children.name",
    ],
  })

  res.json({ categories })
}

interface CreateCategoryBody {
  name: string
  description?: string
  handle?: string
  parent_category_id?: string
  is_active?: boolean
}

export async function POST(
  req: AuthenticatedMedusaRequest<CreateCategoryBody>,
  res: MedusaResponse
) {
  const vendorId = req.auth_context?.actor_id
  const storeId = req.params.id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const isOwner = await verifyStoreOwnership(req, storeId)
  if (!isOwner) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Forbidden")
  }

  const { name, description, handle, parent_category_id, is_active } = req.body

  if (!name) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Category name is required"
    )
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
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Parent category does not belong to this store"
      )
    }

    const productsOnParent = await getProductsOnCategory(req, parent_category_id)
    if (productsOnParent.length > 0) {
      const productIds = productsOnParent.map((p: any) => p.id)
      const productTitles = productsOnParent.map((p: any) => p.title)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        JSON.stringify({
          message: "Cannot add subcategory to a category that has products. Move products first.",
          products_on_parent: productIds,
          product_titles: productTitles,
          count: productsOnParent.length,
        })
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

  res.status(201).json({ category: categories[0] })
}
