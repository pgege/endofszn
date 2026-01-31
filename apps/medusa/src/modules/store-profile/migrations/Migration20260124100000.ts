import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260124100000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "store_profile" ADD COLUMN IF NOT EXISTS "shipping_policy" text NULL;`);
    this.addSql(`ALTER TABLE "store_profile" ADD COLUMN IF NOT EXISTS "returns_policy" text NULL;`);
    this.addSql(`ALTER TABLE "store_profile" ADD COLUMN IF NOT EXISTS "warranty_policy" text NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "store_profile" DROP COLUMN IF EXISTS "shipping_policy";`);
    this.addSql(`ALTER TABLE "store_profile" DROP COLUMN IF EXISTS "returns_policy";`);
    this.addSql(`ALTER TABLE "store_profile" DROP COLUMN IF EXISTS "warranty_policy";`);
  }

}
