import { model } from "@medusajs/framework/utils"

const VendorAdmin = model.define("vendor_admin", {
  id: model.id().primaryKey(),
  email: model.text().searchable(),
  first_name: model.text().nullable(),
  last_name: model.text().nullable(),
})

export default VendorAdmin
