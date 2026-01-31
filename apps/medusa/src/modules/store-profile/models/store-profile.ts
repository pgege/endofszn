import { model } from "@medusajs/framework/utils"

const StoreProfile = model.define("store_profile", {
  id: model.id().primaryKey(),
  store_id: model.text(),
  description: model.text().nullable(),
  tagline: model.text().nullable(),
  logo_url: model.text().nullable(),
  banner_url: model.text().nullable(),
  contact_email: model.text().nullable(),
  contact_phone: model.text().nullable(),
  address_street: model.text().nullable(),
  address_city: model.text().nullable(),
  address_state: model.text().nullable(),
  address_country: model.text().nullable(),
  address_postal_code: model.text().nullable(),
  website_url: model.text().nullable(),
  instagram_url: model.text().nullable(),
  twitter_url: model.text().nullable(),
  facebook_url: model.text().nullable(),
  tiktok_url: model.text().nullable(),
  business_type: model.text().nullable(),
  tax_id: model.text().nullable(),
  registration_number: model.text().nullable(),
  shipping_policy: model.text().nullable(),
  returns_policy: model.text().nullable(),
  warranty_policy: model.text().nullable(),
  is_published: model.boolean().default(false),
  accepts_orders: model.boolean().default(false),
})

export default StoreProfile
