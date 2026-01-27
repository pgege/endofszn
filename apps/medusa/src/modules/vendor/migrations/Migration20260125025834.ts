import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260125025834 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "vendor_admin" ("id" text not null, "email" text not null, "first_name" text null, "last_name" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vendor_admin_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_admin_deleted_at" ON "vendor_admin" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "vendor_admin" cascade;`);
  }

}
