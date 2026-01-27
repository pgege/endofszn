import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { STORE_PROFILE_MODULE } from "../../../../modules/store-profile"
import { VENDOR_MODULE } from "../../../../modules/vendor"
import { z } from "zod"

const updateStoreSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  tagline: z.string().optional(),
  logo_url: z.string().url().nullable().optional(),
  banner_url: z.string().url().nullable().optional(),
  contact_email: z.string().email().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  address_street: z.string().nullable().optional(),
  address_city: z.string().nullable().optional(),
  address_state: z.string().nullable().optional(),
  address_country: z.string().nullable().optional(),
  address_postal_code: z.string().nullable().optional(),
  website_url: z.string().url().nullable().optional(),
  instagram_url: z.string().nullable().optional(),
  twitter_url: z.string().nullable().optional(),
  facebook_url: z.string().nullable().optional(),
  tiktok_url: z.string().nullable().optional(),
  business_type: z.string().nullable().optional(),
  tax_id: z.string().nullable().optional(),
  registration_number: z.string().nullable().optional(),
  is_published: z.boolean().optional(),
  accepts_orders: z.boolean().optional(),
})

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

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const vendorId = req.auth_context?.actor_id
  const storeId = req.params.id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const isOwner = await verifyStoreOwnership(req, storeId)
  if (!isOwner) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Forbidden")
  }

  const storeModuleService = req.scope.resolve(Modules.STORE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const store = await storeModuleService.retrieveStore(storeId)

  const { data: storeWithProfile } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["store_profile.*"],
  })

  const profile = storeWithProfile[0]?.store_profile || null

  res.json({
    store: {
      id: store.id,
      name: store.name,
      supported_currencies: store.supported_currencies,
      created_at: store.created_at,
      updated_at: store.updated_at,
    },
    profile,
  })
}

export async function PUT(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const vendorId = req.auth_context?.actor_id
  const storeId = req.params.id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const isOwner = await verifyStoreOwnership(req, storeId)
  if (!isOwner) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Forbidden")
  }

  const parsed = updateStoreSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      parsed.error.errors.map((e) => e.message).join(", ")
    )
  }

  const storeModuleService = req.scope.resolve(Modules.STORE)
  const storeProfileService = req.scope.resolve(STORE_PROFILE_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { name, ...profileFields } = parsed.data

  if (name) {
    await storeModuleService.updateStores(storeId, { name })
  }

  const { data: storeWithProfile } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["store_profile.id"],
  })

  let profileId = storeWithProfile[0]?.store_profile?.id

  if (Object.keys(profileFields).length > 0) {
    if (profileId) {
      await storeProfileService.updateStoreProfiles(profileId, profileFields)
    } else {
      const link = req.scope.resolve(ContainerRegistrationKeys.LINK)
      const [newProfile] = await storeProfileService.createStoreProfiles([{
        ...profileFields,
      }])
      profileId = newProfile.id
      await link.create({
        [Modules.STORE]: { store_id: storeId },
        [STORE_PROFILE_MODULE]: { store_profile_id: profileId },
      })
    }
  }

  const store = await storeModuleService.retrieveStore(storeId)

  const { data: updatedStoreWithProfile } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["store_profile.*"],
  })

  res.json({
    store: {
      id: store.id,
      name: store.name,
      supported_currencies: store.supported_currencies,
      updated_at: store.updated_at,
    },
    profile: updatedStoreWithProfile[0]?.store_profile || null,
  })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const vendorId = req.auth_context?.actor_id
  const storeId = req.params.id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const isOwner = await verifyStoreOwnership(req, storeId)
  if (!isOwner) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Forbidden")
  }

  const storeModuleService = req.scope.resolve(Modules.STORE)
  const storeProfileService = req.scope.resolve(STORE_PROFILE_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)

  const { data: storeWithProfile } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["store_profile.id"],
  })

  const profileId = storeWithProfile[0]?.store_profile?.id

  await link.dismiss({
    [VENDOR_MODULE]: { vendor_admin_id: vendorId },
    [Modules.STORE]: { store_id: storeId },
  })

  if (profileId) {
    await link.dismiss({
      [Modules.STORE]: { store_id: storeId },
      [STORE_PROFILE_MODULE]: { store_profile_id: profileId },
    })
    await storeProfileService.deleteStoreProfiles(profileId)
  }

  await storeModuleService.deleteStores(storeId)

  res.status(204).send()
}
