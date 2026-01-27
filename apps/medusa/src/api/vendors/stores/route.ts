import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStoreWorkflow } from "../../../workflows/create-store"
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

type CreateStoreBody = z.infer<typeof createStoreSchema>

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const vendorId = req.auth_context?.actor_id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: vendorWithStores } = await query.graph({
    entity: "vendor_admin",
    filters: { id: vendorId },
    fields: ["stores.*", "stores.store_profile.*"],
  })

  const stores = vendorWithStores[0]?.stores || []

  res.json({
    stores: stores.map((store: any) => ({
      id: store.id,
      name: store.name,
      created_at: store.created_at,
      profile: store.store_profile || null,
    })),
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<CreateStoreBody>,
  res: MedusaResponse
) {
  const vendorId = req.auth_context?.actor_id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const parsed = createStoreSchema.safeParse(req.body)
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

  res.status(201).json(result)
}
