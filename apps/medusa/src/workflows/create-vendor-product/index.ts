import { CreateProductWorkflowInputDTO } from "@medusajs/framework/types"
import {
  createWorkflow,
  createStep,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createProductsWorkflow,
  createRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"

type WorkflowInput = {
  store_id: string
  product: CreateProductWorkflowInputDTO & {
    variants?: Array<{ sku?: string; quantity?: number; manage_inventory?: boolean; [key: string]: any }>
  }
}

type WorkflowOutput = {
  product: any
}

function generateHandle(title: string, storeId: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const storePrefix = storeId.replace("store_", "").slice(0, 8).toLowerCase()
  const uniqueSuffix = Math.random().toString(36).slice(2, 8).toLowerCase()
  return `${slug}-${storePrefix}-${uniqueSuffix}`
}

type SetInventoryInput = {
  sku_quantities: Record<string, number>
  location_id: string | null
}

const setInitialInventoryLevelsStep = createStep(
  "set-initial-inventory-levels",
  async (input: SetInventoryInput, { container }) => {
    const entries = Object.entries(input.sku_quantities)
    if (entries.length === 0 || !input.location_id) {
      return new StepResponse(null)
    }

    const inventoryModule = container.resolve(Modules.INVENTORY)
    const skus = entries.map(([sku]) => sku)

    const [inventoryItems] = await inventoryModule.listAndCountInventoryItems(
      { sku: skus } as any,
      { take: skus.length + 10 } as any
    )

    const createdLevelIds: string[] = []

    for (const [sku, quantity] of entries) {
      const invItem = inventoryItems.find((item: any) => item.sku === sku)
      if (!invItem) continue

      const created = await inventoryModule.createInventoryLevels({
        inventory_item_id: invItem.id,
        location_id: input.location_id,
        stocked_quantity: quantity,
      })
      if (created) {
        const lvl = Array.isArray(created) ? created[0] : created
        if (lvl?.id) createdLevelIds.push(lvl.id)
      }
    }

    return new StepResponse(null, createdLevelIds)
  },
  async (createdLevelIds, { container }) => {
    if (!createdLevelIds || createdLevelIds.length === 0) return
    const inventoryModule = container.resolve(Modules.INVENTORY)
    await inventoryModule.deleteInventoryLevels(createdLevelIds)
  }
)

export const createVendorProductWorkflow = createWorkflow(
  "create-vendor-product",
  (input: WorkflowInput): WorkflowResponse<WorkflowOutput> => {
    const { data: stores } = useQueryGraphStep({
      entity: "store",
      fields: ["default_sales_channel_id", "default_location_id"],
      filters: {
        id: input.store_id,
      },
    })

    const productData = transform(
      { input, stores: stores as any },
      (data: any) => {
        const salesChannels = data.stores[0]?.default_sales_channel_id
          ? [{ id: data.stores[0].default_sales_channel_id }]
          : []

        const handle = generateHandle(
          data.input.product.title || "product",
          data.input.store_id
        )

        const variants = (data.input.product.variants || []).map((v: any) => {
          const { quantity, ...rest } = v
          return rest
        })

        return {
          products: [
            {
              ...data.input.product,
              variants,
              handle,
              sales_channels: salesChannels,
            },
          ],
        }
      }
    )

    const createdProducts = createProductsWorkflow.runAsStep({
      input: productData,
    })

    const linksToCreate = transform(
      { input, createdProducts },
      (data) => {
        return data.createdProducts.map((product: any) => ({
          [Modules.STORE]: {
            store_id: data.input.store_id,
          },
          [Modules.PRODUCT]: {
            product_id: product.id,
          },
        }))
      }
    )

    createRemoteLinkStep(linksToCreate)

    const inventoryInput = transform(
      { input, stores: stores as any },
      (data: any) => {
        const skuQuantities: Record<string, number> = {}
        for (const v of data.input.product.variants || []) {
          if (v.sku && v.manage_inventory !== false && typeof v.quantity === "number") {
            skuQuantities[v.sku] = v.quantity
          }
        }
        return {
          sku_quantities: skuQuantities,
          location_id: data.stores[0]?.default_location_id || null,
        }
      }
    )

    setInitialInventoryLevelsStep(inventoryInput)

    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: [
        "*",
        "metadata",
        "variants.*",
        "variants.prices.*",
        "variants.images.*",
        "images.*",
        "options.*",
        "options.values.*",
        "categories.*",
      ],
      filters: {
        id: createdProducts[0].id,
      },
    }).config({ name: "retrieve-created-product" })

    const result = transform({ products }, (data) => ({
      product: data.products[0],
    }))

    return new WorkflowResponse(result)
  }
)

export default createVendorProductWorkflow
