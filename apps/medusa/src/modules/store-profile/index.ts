import { Module } from "@medusajs/framework/utils"
import StoreProfileModuleService from "./service"

export const STORE_PROFILE_MODULE = "storeProfileModuleService"

export default Module(STORE_PROFILE_MODULE, {
  service: StoreProfileModuleService,
})
