import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"

export async function getStoreCategories(
  req: AuthenticatedMedusaRequest,
  storeId: string
): Promise<any[]> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithCategories } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["product_categories.id"],
  })

  const categoryIds = (storeWithCategories[0]?.product_categories || []).map((c: any) => c.id)

  if (categoryIds.length === 0) {
    return []
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
      "category_children.id",
      "category_children.name",
    ],
  })

  return categories
}

export async function storeHasCategories(
  req: AuthenticatedMedusaRequest,
  storeId: string
): Promise<boolean> {
  const categories = await getStoreCategories(req, storeId)
  return categories.length > 0
}

export async function isLeafCategory(
  req: AuthenticatedMedusaRequest,
  categoryId: string
): Promise<boolean> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: categories } = await query.graph({
    entity: "product_category",
    filters: { id: categoryId },
    fields: ["id", "category_children.id"],
  })

  if (!categories.length) {
    return false
  }

  const children = categories[0]?.category_children || []
  return children.length === 0
}

export async function getLeafCategories(
  req: AuthenticatedMedusaRequest,
  storeId: string
): Promise<any[]> {
  const categories = await getStoreCategories(req, storeId)
  return categories.filter((cat: any) => {
    const children = cat.category_children || []
    return children.length === 0
  })
}

export async function validateCategoriesAreLeaves(
  req: AuthenticatedMedusaRequest,
  storeId: string,
  categoryIds: string[]
): Promise<void> {
  if (!categoryIds || categoryIds.length === 0) {
    return
  }

  const categories = await getStoreCategories(req, storeId)
  const categoryMap = new Map(categories.map((cat: any) => [cat.id, cat]))

  const nonLeafCategories: string[] = []

  for (const categoryId of categoryIds) {
    const category = categoryMap.get(categoryId)
    if (!category) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Category ${categoryId} does not belong to this store`
      )
    }

    const children = category.category_children || []
    if (children.length > 0) {
      nonLeafCategories.push(categoryId)
    }
  }

  if (nonLeafCategories.length > 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Products can only be assigned to leaf categories (categories with no subcategories). Non-leaf categories: ${nonLeafCategories.join(", ")}`
    )
  }
}

export async function validateProductHasCategory(
  req: AuthenticatedMedusaRequest,
  storeId: string,
  categoryIds: string[] | undefined
): Promise<void> {
  const hasCategories = await storeHasCategories(req, storeId)

  if (hasCategories && (!categoryIds || categoryIds.length === 0)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "This store has categories configured. Products must be assigned to at least one category."
    )
  }
}

export async function getProductsOnCategory(
  req: AuthenticatedMedusaRequest,
  categoryId: string
): Promise<any[]> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: categories } = await query.graph({
    entity: "product_category",
    filters: { id: categoryId },
    fields: ["id", "products.id", "products.title"],
  })

  return categories[0]?.products || []
}
