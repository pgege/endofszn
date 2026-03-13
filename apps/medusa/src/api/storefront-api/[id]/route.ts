import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeId = req.params.id

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: stores } = await query.graph({
    entity: "store",
    filters: { id: storeId },
    fields: ["id", "name", "supported_currencies", "created_at", "updated_at", "store_profile.*"],
  })

  const store = stores[0]
  if (!store) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Store not found")
  }

  const profile = store?.store_profile ?? null

  res.json({
    store: {
      id: store.id,
      name: store.name,
      tagline: profile?.tagline ?? null,
      description: profile?.description ?? null,
      logo_url: profile?.logo_url ?? null,
      banner_url: profile?.banner_url ?? null,
      contact_email: profile?.contact_email ?? null,
      website_url: profile?.website_url ?? null,
      supported_currencies: store.supported_currencies || [],
      created_at: store.created_at ?? "",
      updated_at: store.updated_at ?? "",
    },
  })
}
