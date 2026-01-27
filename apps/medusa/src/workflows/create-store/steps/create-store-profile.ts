import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { STORE_PROFILE_MODULE } from "../../../modules/store-profile"

export type CreateStoreProfileStepInput = {
  store_id: string
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
}

export const createStoreProfileStep = createStep(
  "create-store-profile-step",
  async (input: CreateStoreProfileStepInput, { container }) => {
    const storeProfileService = container.resolve(STORE_PROFILE_MODULE)

    const profile = await storeProfileService.createStoreProfiles({
      store_id: input.store_id,
      description: input.description || null,
      tagline: input.tagline || null,
      logo_url: input.logo_url || null,
      banner_url: input.banner_url || null,
      contact_email: input.contact_email || null,
      contact_phone: input.contact_phone || null,
      address_street: input.address?.street || null,
      address_city: input.address?.city || null,
      address_state: input.address?.state || null,
      address_country: input.address?.country || null,
      address_postal_code: input.address?.postal_code || null,
      website_url: input.social_links?.website || null,
      instagram_url: input.social_links?.instagram || null,
      twitter_url: input.social_links?.twitter || null,
      facebook_url: input.social_links?.facebook || null,
      tiktok_url: input.social_links?.tiktok || null,
      business_type: input.business_info?.business_type || null,
      tax_id: input.business_info?.tax_id || null,
      registration_number: input.business_info?.registration_number || null,
      is_published: false,
      accepts_orders: false,
    })

    return new StepResponse(
      {
        id: profile.id,
        store_id: profile.store_id,
        description: profile.description,
        tagline: profile.tagline,
        logo_url: profile.logo_url,
        banner_url: profile.banner_url,
        is_published: profile.is_published,
        accepts_orders: profile.accepts_orders,
      },
      profile.id
    )
  },
  async (profileId, { container }) => {
    if (!profileId) return

    const storeProfileService = container.resolve(STORE_PROFILE_MODULE)
    await storeProfileService.deleteStoreProfiles(profileId)
  }
)
