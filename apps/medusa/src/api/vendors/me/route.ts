import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { VENDOR_MODULE } from "../../../modules/vendor"
import VendorModuleService from "../../../modules/vendor/service"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const vendorId = req.auth_context?.actor_id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const vendorModuleService: VendorModuleService = req.scope.resolve(VENDOR_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  let vendorAdmin
  try {
    vendorAdmin = await vendorModuleService.retrieveVendorAdmin(vendorId)
  } catch {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Vendor not found")
  }

  const { data: vendorWithStores } = await query.graph({
    entity: "vendor_admin",
    filters: { id: vendorId },
    fields: ["stores.*", "stores.store_profile.*"],
  })

  const stores = vendorWithStores[0]?.stores || []

  res.json({
    vendor: {
      id: vendorAdmin.id,
      email: vendorAdmin.email,
      first_name: vendorAdmin.first_name,
      last_name: vendorAdmin.last_name,
    },
    stores: stores.map((store: any) => ({
      id: store.id,
      name: store.name,
      created_at: store.created_at,
      profile: store.store_profile || null,
    })),
  })
}
