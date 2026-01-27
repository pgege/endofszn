import { MedusaService } from "@medusajs/framework/utils"
import VendorAdmin from "./models/vendor-admin"

class VendorModuleService extends MedusaService({
  VendorAdmin,
}) {}

export default VendorModuleService
