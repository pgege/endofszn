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
import { getTemplateById, CategoryNode } from "../templates/data"
import { wrapHandler } from "../../../helpers/wrap-handler"

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

function generateHandle(name: string, storeId: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const storePrefix = storeId.replace("store_", "").slice(0, 6)
  const uniqueSuffix = Math.random().toString(36).slice(2, 6)
  return `${slug}-${storePrefix}-${uniqueSuffix}`
}

interface ApplyTemplateBody {
  template_id: string
}

export const POST = wrapHandler(async (
  req: AuthenticatedMedusaRequest<ApplyTemplateBody>,
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

  const { template_id } = req.body

  if (!template_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "template_id is required"
    )
  }

  const template = getTemplateById(template_id)
  if (!template) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Template '${template_id}' not found`
    )
  }

  const createdCategories: any[] = []
  const remoteLink = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK)

  async function createCategoryRecursive(
    node: CategoryNode | string,
    parentId: string | undefined
  ): Promise<void> {
    const name = typeof node === "string" ? node : node.name
    const children = typeof node === "string" ? undefined : node.children

    const { result } = await createProductCategoriesWorkflow(req.scope).run({
      input: {
        product_categories: [
          {
            name,
            handle: generateHandle(name, storeId),
            parent_category_id: parentId,
            is_active: true,
            is_internal: false,
          },
        ],
      },
    })

    const createdCategory = result[0]
    createdCategories.push(createdCategory)

    await remoteLink.create({
      [Modules.STORE]: { store_id: storeId },
      [Modules.PRODUCT]: { product_category_id: createdCategory.id },
    })

    if (children && children.length > 0) {
      for (const child of children) {
        await createCategoryRecursive(child, createdCategory.id)
      }
    }
  }

  for (const rootNode of template.structure) {
    await createCategoryRecursive(rootNode, undefined)
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const categoryIds = createdCategories.map((c: any) => c.id)

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

  res.status(201).json({
    message: `Applied template '${template.name}' successfully`,
    categories,
    count: createdCategories.length,
  })
})
