import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { normalizeProduct } from "../../helpers"

function parseArrayParam(val: unknown): string[] | null {
  if (!val) return null
  return (Array.isArray(val) ? val : [val]) as string[]
}

function parseOptionParams(queryObj: any): Record<string, string[]> {
  const options: Record<string, string[]> = {}
  for (const key of Object.keys(queryObj)) {
    if (!key.startsWith("option[") || !key.endsWith("]")) continue
    const optName = key.slice(7, -1)
    if (!optName) continue
    const val = queryObj[key]
    const values = Array.isArray(val) ? val as string[] : [val as string]
    options[optName] = values
  }
  return options
}

async function resolveCategoryTree(
  query: any,
  categoryIds: string[]
): Promise<{
  rootGroups: Map<string, Set<string>>
  descendantMap: Map<string, Set<string>>
}> {
  const { data: categories } = await query.graph({
    entity: "product_category",
    filters: { id: categoryIds },
    fields: [
      "id",
      "parent_category.id",
      "parent_category.parent_category.id",
      "parent_category.parent_category.parent_category.id",
      "category_children.id",
      "category_children.category_children.id",
      "category_children.category_children.category_children.id",
    ],
  })

  const catById = new Map<string, any>()
  for (const c of categories as any[]) catById.set(c.id, c)

  function getRootId(cat: any): string {
    let cursor = cat
    while (cursor.parent_category?.id) {
      const parent = catById.get(cursor.parent_category.id)
      if (parent) {
        cursor = parent
      } else {
        let p = cursor.parent_category
        while (p?.parent_category?.id) p = p.parent_category
        return p?.id ?? cursor.parent_category.id
      }
    }
    return cursor.id
  }

  function collectDescendants(cat: any, result: Set<string>) {
    for (const child of cat.category_children || []) {
      result.add(child.id)
      collectDescendants(child, result)
    }
  }

  const ancestorOf = new Map<string, Set<string>>()
  function getAncestors(cat: any): Set<string> {
    if (ancestorOf.has(cat.id)) return ancestorOf.get(cat.id)!
    const ancs = new Set<string>()
    let cursor = cat.parent_category
    while (cursor?.id) {
      ancs.add(cursor.id)
      const parentCat = catById.get(cursor.id)
      cursor = parentCat?.parent_category ?? cursor.parent_category ?? null
    }
    ancestorOf.set(cat.id, ancs)
    return ancs
  }

  const selectedSet = new Set(categoryIds)
  const collapsed: string[] = []
  for (const id of categoryIds) {
    const cat = catById.get(id)
    if (!cat) { collapsed.push(id); continue }
    const ancestors = getAncestors(cat)
    let hasDescendantSelected = false
    for (const otherId of categoryIds) {
      if (otherId === id) continue
      const otherCat = catById.get(otherId)
      if (!otherCat) continue
      const otherAncestors = getAncestors(otherCat)
      if (otherAncestors.has(id)) { hasDescendantSelected = true; break }
    }
    if (!hasDescendantSelected) collapsed.push(id)
  }

  const rootGroups = new Map<string, Set<string>>()
  const descendantMap = new Map<string, Set<string>>()
  for (const id of collapsed) {
    const cat = catById.get(id)
    const rootId = cat ? getRootId(cat) : id
    if (!rootGroups.has(rootId)) rootGroups.set(rootId, new Set())
    rootGroups.get(rootId)!.add(id)

    const descs = new Set<string>()
    if (cat) collectDescendants(cat, descs)
    descs.add(id)
    descendantMap.set(id, descs)
  }

  return { rootGroups, descendantMap }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeId = req.params.id

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const offset = parseInt(req.query.offset as string) || 0
  const q = (req.query.q as string || "").trim().toLowerCase()
  const statusFilter = parseArrayParam(req.query.status) || ["published"]
  const categoryIds = parseArrayParam(req.query.category_id)
  let collectionIds = parseArrayParam(req.query.collection_id)
  const collectionHandle = req.query.collection_handle as string | undefined
  const orderParam = (req.query.order as string) || "-created_at"
  const optionFilters = parseOptionParams(req.query)

  const queryResolver = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  if (collectionHandle && !collectionIds) {
    const productModule = req.scope.resolve(Modules.PRODUCT)
    const [collections] = await productModule.listAndCountProductCollections(
      { handle: collectionHandle } as any,
      { select: ["id"] }
    )
    if ((collections as any[]).length > 0) {
      collectionIds = [(collections as any[])[0].id]
    }
  }

  const { data: storeWithProducts } = await queryResolver.graph({
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
      "products.variants.sku",
      "products.variants.manage_inventory",
      "products.variants.allow_backorder",
      "products.variants.options.*",
      "products.variants.prices.*",
      "products.options.id",
      "products.options.title",
      "products.options.values.*",
      "products.categories.id",
      "products.categories.name",
      "products.categories.handle",
    ],
  })

  let products = storeWithProducts[0]?.products || []

  if (statusFilter) {
    products = products.filter((p: any) => statusFilter.includes(p.status))
  }

  if (collectionIds) {
    products = products.filter((p: any) =>
      p.collection_id && collectionIds!.includes(p.collection_id)
    )
  }

  if (q) {
    products = products.filter((p: any) =>
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    )
  }

  if (categoryIds && categoryIds.length > 0) {
    const { rootGroups, descendantMap } = await resolveCategoryTree(queryResolver, categoryIds)

    products = products.filter((p: any) => {
      const productCatIds = new Set((p.categories || []).map((c: any) => c.id))
      for (const [, groupIds] of rootGroups) {
        let groupMatched = false
        for (const selectedId of groupIds) {
          const expandedIds = descendantMap.get(selectedId) || new Set([selectedId])
          for (const eid of expandedIds) {
            if (productCatIds.has(eid)) { groupMatched = true; break }
          }
          if (groupMatched) break
        }
        if (!groupMatched) return false
      }
      return true
    })
  }

  const availableOptions = computeAvailableOptions(products)

  const optionKeys = Object.keys(optionFilters)
  if (optionKeys.length > 0) {
    products = products.filter((p: any) => {
      const variants = p.variants || []
      return variants.some((v: any) => {
        const variantOptions: Record<string, string> = {}
        for (const opt of v.options || []) {
          variantOptions[opt.option?.title ?? opt.title ?? ""] = opt.value
        }
        return optionKeys.every((key) => {
          const acceptedValues = optionFilters[key]
          const variantValue = variantOptions[key]
          return variantValue && acceptedValues.includes(variantValue)
        })
      })
    })
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

  res.json({
    products: paginated.map(normalizeProduct),
    count,
    limit,
    offset,
    available_options: availableOptions,
  })
}

function computeAvailableOptions(products: any[]): { title: string; values: string[] }[] {
  const optionMap = new Map<string, Set<string>>()
  for (const p of products) {
    for (const v of p.variants || []) {
      for (const opt of v.options || []) {
        const title = opt.option?.title ?? opt.title ?? ""
        if (!title) continue
        if (!optionMap.has(title)) optionMap.set(title, new Set())
        optionMap.get(title)!.add(opt.value)
      }
    }
  }

  return [...optionMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, values]) => ({
      title,
      values: [...values].sort((a, b) => {
        const aNum = parseFloat(a)
        const bNum = parseFloat(b)
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum
        return a.localeCompare(b)
      }),
    }))
}
