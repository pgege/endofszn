import { CreateProductWorkflowInputDTO } from "@medusajs/framework/types"
import {
  createWorkflow,
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
  product: CreateProductWorkflowInputDTO
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

export const createVendorProductWorkflow = createWorkflow(
  "create-vendor-product",
  (input: WorkflowInput): WorkflowResponse<WorkflowOutput> => {
    const { data: stores } = useQueryGraphStep({
      entity: "store",
      fields: ["default_sales_channel_id"],
      filters: {
        id: input.store_id,
      },
    })

    const productData = transform(
      { input, stores },
      (data) => {
        const salesChannels = data.stores[0]?.default_sales_channel_id
          ? [{ id: data.stores[0].default_sales_channel_id }]
          : []

        const handle = generateHandle(
          data.input.product.title || "product",
          data.input.store_id
        )

        return {
          products: [
            {
              ...data.input.product,
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

    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: [
        "*",
        "variants.*",
        "variants.prices.*",
        "variants.images.*",
        "images.*",
        "options.*",
        "options.values.*",
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
