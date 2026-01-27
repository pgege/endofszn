import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260125030111 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "store_profile" ("id" text not null, "store_id" text not null, "description" text null, "tagline" text null, "logo_url" text null, "banner_url" text null, "contact_email" text null, "contact_phone" text null, "address_street" text null, "address_city" text null, "address_state" text null, "address_country" text null, "address_postal_code" text null, "website_url" text null, "instagram_url" text null, "twitter_url" text null, "facebook_url" text null, "tiktok_url" text null, "business_type" text null, "tax_id" text null, "registration_number" text null, "is_published" boolean not null default false, "accepts_orders" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "store_profile_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_store_profile_deleted_at" ON "store_profile" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "store_profile" cascade;`);
  }

}
