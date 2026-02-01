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
  updateProductCategoriesWorkflow,
  deleteProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows"

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
  categoryId: string
): Promise<boolean> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithCategories } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["product_categories.id"],
  })

  const categories = storeWithCategories[0]?.product_categories || []
  return categories.some((cat: any) => cat.id === categoryId)
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const vendorId = req.auth_context?.actor_id
  const storeId = req.params.id
  const categoryId = req.params.categoryId

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const isOwner = await verifyStoreOwnership(req, storeId)
  if (!isOwner) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Forbidden")
  }

  const isCategoryOwner = await verifyCategoryOwnership(req, storeId, categoryId)
  if (!isCategoryOwner) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Category not found")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: categories } = await query.graph({
    entity: "product_category",
    filters: { id: categoryId },
    fields: [
      "*",
      "parent_category.*",
      "category_children.*",
      "products.*",
      "products.variants.*",
      "products.images.*",
    ],
  })

  res.json({ category: categories[0] })
}

interface UpdateCategoryBody {
  name?: string
  description?: string
  handle?: string
  parent_category_id?: string | null
  is_active?: boolean
}

export async function PUT(
  req: AuthenticatedMedusaRequest<UpdateCategoryBody>,
  res: MedusaResponse
) {
  const vendorId = req.auth_context?.actor_id
  const storeId = req.params.id
  const categoryId = req.params.categoryId

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const isOwner = await verifyStoreOwnership(req, storeId)
  if (!isOwner) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Forbidden")
  }

  const isCategoryOwner = await verifyCategoryOwnership(req, storeId, categoryId)
  if (!isCategoryOwner) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Category not found")
  }

  const { name, description, handle, parent_category_id, is_active } = req.body

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
    if (parent_category_id === categoryId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Category cannot be its own parent"
      )
    }
  }

  const updateData: any = { id: categoryId }
  if (name !== undefined) updateData.name = name
  if (description !== undefined) updateData.description = description
  if (handle !== undefined) updateData.handle = handle
  if (parent_category_id !== undefined)
    updateData.parent_category_id = parent_category_id
  if (is_active !== undefined) updateData.is_active = is_active

  await updateProductCategoriesWorkflow(req.scope).run({
    input: {
      product_categories: [updateData],
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: categories } = await query.graph({
    entity: "product_category",
    filters: { id: categoryId },
    fields: ["*", "parent_category.*", "category_children.*"],
  })

  res.json({ category: categories[0] })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const vendorId = req.auth_context?.actor_id
  const storeId = req.params.id
  const categoryId = req.params.categoryId

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const isOwner = await verifyStoreOwnership(req, storeId)
  if (!isOwner) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Forbidden")
  }

  const isCategoryOwner = await verifyCategoryOwnership(req, storeId, categoryId)
  if (!isCategoryOwner) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Category not found")
  }

  const remoteLink = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK)
  await remoteLink.dismiss({
    [Modules.STORE]: { store_id: storeId },
    [Modules.PRODUCT]: { product_category_id: categoryId },
  })

  await deleteProductCategoriesWorkflow(req.scope).run({
    input: { ids: [categoryId] },
  })

  res.status(200).json({ id: categoryId, deleted: true })
}
