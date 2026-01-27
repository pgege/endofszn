import { defineLink } from "@medusajs/framework/utils"
import StoreModule from "@medusajs/medusa/store"
import StoreProfileModule from "../modules/store-profile"

export default defineLink(
  StoreModule.linkable.store,
  StoreProfileModule.linkable.storeProfile
)
