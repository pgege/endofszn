import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { VENDOR_MODULE } from "../../../modules/vendor"
import VendorModuleService from "../../../modules/vendor/service"

export type CreateVendorAdminStepInput = {
  email: string
  first_name?: string
  last_name?: string
}

export const createVendorAdminStep = createStep(
  "create-vendor-admin-step",
  async (input: CreateVendorAdminStepInput, { container }) => {
    const vendorModuleService: VendorModuleService = container.resolve(VENDOR_MODULE)

    const vendorAdmin = await vendorModuleService.createVendorAdmins({
      email: input.email,
      first_name: input.first_name || null,
      last_name: input.last_name || null,
    })

    return new StepResponse(
      {
        id: vendorAdmin.id,
        email: vendorAdmin.email,
        first_name: vendorAdmin.first_name,
        last_name: vendorAdmin.last_name,
      },
      vendorAdmin.id
    )
  },
  async (vendorAdminId, { container }) => {
    if (!vendorAdminId) return

    const vendorModuleService: VendorModuleService = container.resolve(VENDOR_MODULE)
    await vendorModuleService.deleteVendorAdmins(vendorAdminId)
  }
)
