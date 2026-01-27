import { MedusaService } from "@medusajs/framework/utils"
import StoreProfile from "./models/store-profile"

class StoreProfileModuleService extends MedusaService({
  StoreProfile,
}) {}

export default StoreProfileModuleService
