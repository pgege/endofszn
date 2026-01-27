import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { createStoreRecordStep } from "./steps/create-store-record"
import { createStoreProfileStep } from "./steps/create-store-profile"
import { linkVendorToStoreStep } from "./steps/link-vendor-to-store"
import { linkStoreToProfileStep } from "./steps/link-store-to-profile"

export type CreateStoreInput = {
  vendor_id: string
  name: string
  description?: string
  tagline?: string
  logo_url?: string
  banner_url?: string
  contact_email?: string
  contact_phone?: string
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    postal_code?: string
  }
  social_links?: {
    website?: string
    instagram?: string
    twitter?: string
    facebook?: string
    tiktok?: string
  }
  business_info?: {
    business_type?: string
    tax_id?: string
    registration_number?: string
  }
  default_currency_code?: string
}

export type CreateStoreOutput = {
  store: {
    id: string
    name: string
    default_currency_code: string
  }
  profile: {
    id: string
    store_id: string
    description: string | null
    tagline: string | null
    logo_url: string | null
    banner_url: string | null
    is_published: boolean
    accepts_orders: boolean
  }
}

export const createStoreWorkflow = createWorkflow(
  "create-store",
  (input: CreateStoreInput): WorkflowResponse<CreateStoreOutput> => {
    const storeRecordInput = transform(input, (data) => ({
      name: data.name,
      default_currency_code: data.default_currency_code || "usd",
    }))

    const store = createStoreRecordStep(storeRecordInput)

    const profile = createStoreProfileStep({
      store_id: store.id,
      description: input.description,
      tagline: input.tagline,
      logo_url: input.logo_url,
      banner_url: input.banner_url,
      contact_email: input.contact_email,
      contact_phone: input.contact_phone,
      address: input.address,
      social_links: input.social_links,
      business_info: input.business_info,
    })

    linkVendorToStoreStep({
      vendor_id: input.vendor_id,
      store_id: store.id,
    })

    linkStoreToProfileStep({
      store_id: store.id,
      profile_id: profile.id,
    })

    return new WorkflowResponse({
      store,
      profile,
    })
  }
)

export default createStoreWorkflow
