import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeId = req.params.id
  const handle = req.params.handle

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithCategories } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["product_categories.id"],
  })

  const categoryIds = (storeWithCategories[0]?.product_categories || []).map((c: any) => c.id)

  if (categoryIds.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Category with handle "${handle}" not found in this store`)
  }

  const { data: allCategories } = await query.graph({
    entity: "product_category",
    filters: { id: categoryIds },
    fields: [
      "id", "name", "description", "handle", "is_active",
      "parent_category.id", "parent_category.name", "parent_category.handle",
      "category_children.id", "category_children.name", "category_children.handle",
    ],
  })

  const raw = (allCategories as any[]).find(
    (c: any) => c.handle === handle && c.is_active !== false
  )

  if (!raw) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Category with handle "${handle}" not found in this store`)
  }

  const parent = raw.parent_category
    ? { id: raw.parent_category.id, name: raw.parent_category.name, handle: raw.parent_category.handle ?? "" }
    : null
  const children = (raw.category_children || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    handle: c.handle ?? "",
  }))

  res.json({
    category: {
      id: raw.id,
      name: raw.name,
      handle: raw.handle,
      description: raw.description ?? null,
      parent,
      children,
    },
  })
}
