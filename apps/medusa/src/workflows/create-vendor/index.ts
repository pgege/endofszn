import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { setAuthAppMetadataStep } from "@medusajs/medusa/core-flows"
import { createVendorAdminStep } from "./steps/create-vendor-admin"

export type CreateVendorInput = {
  email: string
  first_name?: string
  last_name?: string
  auth_identity_id: string
}

export type CreateVendorOutput = {
  vendor_admin: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
  }
}

export const createVendorWorkflow = createWorkflow(
  "create-vendor",
  (input: CreateVendorInput): WorkflowResponse<CreateVendorOutput> => {
    const vendorAdmin = createVendorAdminStep({
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
    })

    setAuthAppMetadataStep({
      authIdentityId: input.auth_identity_id,
      actorType: "vendor",
      value: vendorAdmin.id,
    })

    return new WorkflowResponse({
      vendor_admin: vendorAdmin,
    })
  }
)

export default createVendorWorkflow
