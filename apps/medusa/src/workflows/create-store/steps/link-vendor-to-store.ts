import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { VENDOR_MODULE } from "../../../modules/vendor"

export type LinkVendorToStoreStepInput = {
  vendor_id: string
  store_id: string
}

export const linkVendorToStoreStep = createStep(
  "link-vendor-to-store-step",
  async (input: LinkVendorToStoreStepInput, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    await link.create({
      [VENDOR_MODULE]: {
        vendor_admin_id: input.vendor_id,
      },
      [Modules.STORE]: {
        store_id: input.store_id,
      },
    })

    return new StepResponse(undefined, input)
  },
  async (input, { container }) => {
    if (!input) return

    const link = container.resolve(ContainerRegistrationKeys.LINK)

    await link.dismiss({
      [VENDOR_MODULE]: {
        vendor_admin_id: input.vendor_id,
      },
      [Modules.STORE]: {
        store_id: input.store_id,
      },
    })
  }
)
