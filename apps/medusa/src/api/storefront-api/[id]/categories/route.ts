import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

interface TreeNode {
  id: string
  name: string
  handle: string
  description: string | null
  children: TreeNode[]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeId = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storeWithProducts } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["products.categories.id"],
  })

  const leafIds = new Set<string>()
  for (const product of storeWithProducts[0]?.products || []) {
    for (const cat of product.categories || []) {
      leafIds.add(cat.id)
    }
  }

  if (leafIds.size === 0) {
    res.json({ tree: [], count: 0 })
    return
  }

  const allNeededIds = new Set<string>(leafIds)
  const categoryMap = new Map<string, any>()

  const { data: leafCategories } = await query.graph({
    entity: "product_category",
    filters: { id: [...leafIds] },
    fields: [
      "id", "name", "description", "handle", "is_active",
      "parent_category.id", "parent_category.name", "parent_category.handle", "parent_category.description",
      "parent_category.parent_category.id", "parent_category.parent_category.name", "parent_category.parent_category.handle", "parent_category.parent_category.description",
      "parent_category.parent_category.parent_category.id",
    ],
  })

  for (const cat of leafCategories as any[]) {
    categoryMap.set(cat.id, cat)
    let cursor = cat.parent_category
    while (cursor) {
      allNeededIds.add(cursor.id)
      if (!categoryMap.has(cursor.id)) {
        categoryMap.set(cursor.id, {
          id: cursor.id,
          name: cursor.name,
          handle: cursor.handle ?? "",
          description: cursor.description ?? null,
          parent_category: cursor.parent_category ?? null,
        })
      }
      cursor = cursor.parent_category
    }
  }

  const childrenMap = new Map<string, Set<string>>()
  for (const [id, cat] of categoryMap) {
    const parentId = cat.parent_category?.id
    if (parentId && allNeededIds.has(parentId)) {
      if (!childrenMap.has(parentId)) childrenMap.set(parentId, new Set())
      childrenMap.get(parentId)!.add(id)
    }
  }

  function buildNode(id: string): TreeNode {
    const cat = categoryMap.get(id)!
    const childIds = childrenMap.get(id) || new Set()
    return {
      id: cat.id,
      name: cat.name,
      handle: cat.handle ?? "",
      description: cat.description ?? null,
      children: [...childIds]
        .map(buildNode)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }
  }

  const rootIds: string[] = []
  for (const id of allNeededIds) {
    const cat = categoryMap.get(id)
    if (!cat) continue
    const parentId = cat.parent_category?.id
    if (!parentId || !allNeededIds.has(parentId)) {
      rootIds.push(id)
    }
  }

  const tree = rootIds
    .map(buildNode)
    .sort((a, b) => a.name.localeCompare(b.name))

  let count = 0
  function countNodes(nodes: TreeNode[]) {
    for (const n of nodes) {
      count++
      countNodes(n.children)
    }
  }
  countNodes(tree)

  res.json({ tree, count })
}
