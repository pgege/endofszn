import { defineLink } from "@medusajs/framework/utils"
import StoreModule from "@medusajs/medusa/store"
import VendorModule from "../modules/vendor"

export default defineLink(
  VendorModule.linkable.vendorAdmin,
  {
    linkable: StoreModule.linkable.store,
    isList: true,
  }
)
