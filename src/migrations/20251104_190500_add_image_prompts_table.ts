import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "content_plans_content_items_image_prompts" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "prompt" text
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "content_plans_content_items_image_prompts" ADD CONSTRAINT "content_plans_content_items_image_prompts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "content_plans_content_items"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "content_plans_content_items_image_prompts_order_idx" ON "content_plans_content_items_image_prompts" ("_order");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "content_plans_content_items_image_prompts_parent_id_idx" ON "content_plans_content_items_image_prompts" ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "content_plans_content_items_image_prompts";`)
}