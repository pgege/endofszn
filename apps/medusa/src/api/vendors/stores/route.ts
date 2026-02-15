import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createStoreWorkflow } from "../../../workflows/create-store"
import { STORE_PROFILE_MODULE } from "../../../modules/store-profile"
import { VENDOR_MODULE } from "../../../modules/vendor"
import { wrapHandler } from "./helpers/wrap-handler"
import { z } from "zod"

const createStoreSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  tagline: z.string().optional(),
  logo_url: z.string().url().optional(),
  banner_url: z.string().url().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postal_code: z.string().optional(),
    })
    .optional(),
  social_links: z
    .object({
      website: z.string().url().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      facebook: z.string().optional(),
      tiktok: z.string().optional(),
    })
    .optional(),
  business_info: z
    .object({
      business_type: z.string().optional(),
      tax_id: z.string().optional(),
      registration_number: z.string().optional(),
    })
    .optional(),
  default_currency_code: z.string().length(3).optional(),
})

const updateStoreSchema = z.object({
  id: z.string(),
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
  shipping_policy: z.string().nullable().optional(),
  returns_policy: z.string().nullable().optional(),
  warranty_policy: z.string().nullable().optional(),
  is_published: z.boolean().optional(),
  accepts_orders: z.boolean().optional(),
})

async function getVendorStoreIds(req: AuthenticatedMedusaRequest, vendorId: string): Promise<string[]> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: vendorWithStores } = await query.graph({
    entity: "vendor_admin",
    filters: { id: vendorId },
    fields: ["stores.id"],
  })
  return (vendorWithStores[0]?.stores || []).map((s: any) => s.id)
}

export const GET = wrapHandler(async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const vendorId = req.auth_context?.actor_id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const offset = parseInt(req.query.offset as string) || 0
  const q = (req.query.q as string || "").trim().toLowerCase()
  const orderParam = (req.query.order as string) || "-created_at"
  const idFilter = req.query.id
    ? (Array.isArray(req.query.id) ? req.query.id : [req.query.id]) as string[]
    : null

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: vendorWithStores } = await query.graph({
    entity: "vendor_admin",
    filters: { id: vendorId },
    fields: ["stores.*", "stores.store_profile.*"],
  })

  let stores = (vendorWithStores[0]?.stores || []).map((store: any) => ({
    id: store.id,
    name: store.name,
    supported_currencies: store.supported_currencies,
    created_at: store.created_at,
    updated_at: store.updated_at,
    profile: store.store_profile || null,
  }))

  if (idFilter) {
    stores = stores.filter((s: any) => idFilter.includes(s.id))
  }

  if (q) {
    stores = stores.filter((s: any) =>
      s.name?.toLowerCase().includes(q)
    )
  }

  const desc = orderParam.startsWith("-")
  const sortField = desc ? orderParam.slice(1) : orderParam
  stores.sort((a: any, b: any) => {
    const aVal = a[sortField] ?? ""
    const bVal = b[sortField] ?? ""
    if (aVal < bVal) return desc ? 1 : -1
    if (aVal > bVal) return desc ? -1 : 1
    return 0
  })

  const count = stores.length
  const paginated = stores.slice(offset, offset + limit)

  res.json({ stores: paginated, count, limit, offset })
})

export const POST = wrapHandler(async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const vendorId = req.auth_context?.actor_id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const rawItems = Array.isArray(req.body) ? req.body : [req.body]
  const results: any[] = []

  for (const item of rawItems) {
    const parsed = createStoreSchema.safeParse(item)
    if (!parsed.success) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        parsed.error.errors.map((e) => e.message).join(", ")
      )
    }

    const { result } = await createStoreWorkflow(req.scope).run({
      input: {
        vendor_id: vendorId,
        ...parsed.data,
      },
    })
    results.push(result)
  }

  res.status(201).json({ stores: results })
})

export const PUT = wrapHandler(async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const vendorId = req.auth_context?.actor_id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const ownedStoreIds = await getVendorStoreIds(req, vendorId)
  const rawItems = Array.isArray(req.body) ? req.body : [req.body]

  const storeModuleService = req.scope.resolve(Modules.STORE)
  const storeProfileService = req.scope.resolve(STORE_PROFILE_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)

  for (const item of rawItems) {
    const parsed = updateStoreSchema.safeParse(item)
    if (!parsed.success) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        parsed.error.errors.map((e) => e.message).join(", ")
      )
    }

    const { id, name, ...profileFields } = parsed.data

    if (!ownedStoreIds.includes(id)) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Forbidden: store ${id}`)
    }

    if (name) {
      await storeModuleService.updateStores(id, { name })
    }

    const { data: storeWithProfile } = await query.graph({
      entity: "store",
      filters: { id },
      fields: ["store_profile.id"],
    })

    let profileId = storeWithProfile[0]?.store_profile?.id

    if (Object.keys(profileFields).length > 0) {
      if (profileId) {
        await storeProfileService.updateStoreProfiles({ id: profileId, ...profileFields })
      } else {
        const [newProfile] = await storeProfileService.createStoreProfiles([profileFields])
        profileId = newProfile.id
        await link.create({
          [Modules.STORE]: { store_id: id },
          [STORE_PROFILE_MODULE]: { store_profile_id: profileId },
        })
      }
    }
  }

  const updatedIds = rawItems.map((item: any) => item.id)
  const { data: updatedStores } = await query.graph({
    entity: "store",
    filters: { id: updatedIds },
    fields: ["*", "store_profile.*"],
  })

  const stores = updatedStores.map((s: any) => ({
    id: s.id,
    name: s.name,
    supported_currencies: s.supported_currencies,
    created_at: s.created_at,
    updated_at: s.updated_at,
    profile: s.store_profile || null,
  }))

  res.json({ stores })
})

export const DELETE = wrapHandler(async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const vendorId = req.auth_context?.actor_id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const { ids } = req.body as any

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "ids array is required")
  }

  const ownedStoreIds = await getVendorStoreIds(req, vendorId)
  for (const storeId of ids) {
    if (!ownedStoreIds.includes(storeId)) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Forbidden: store ${storeId}`)
    }
  }

  const storeModuleService = req.scope.resolve(Modules.STORE)
  const storeProfileService = req.scope.resolve(STORE_PROFILE_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const linkService = req.scope.resolve(ContainerRegistrationKeys.LINK)

  for (const storeId of ids) {
    const { data: storeWithProfile } = await query.graph({
      entity: "store",
      filters: { id: storeId },
      fields: ["store_profile.id"],
    })

    const profileId = storeWithProfile[0]?.store_profile?.id

    await linkService.dismiss({
      [VENDOR_MODULE]: { vendor_admin_id: vendorId },
      [Modules.STORE]: { store_id: storeId },
    })

    if (profileId) {
      await linkService.dismiss({
        [Modules.STORE]: { store_id: storeId },
        [STORE_PROFILE_MODULE]: { store_profile_id: profileId },
      })
      await storeProfileService.deleteStoreProfiles(profileId)
    }

    await storeModuleService.deleteStores(storeId)
  }

  res.json({ deleted: ids })
})
