import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Create content_plans_content_items table if it doesn't exist
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "content_plans_content_items" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar,
      "description" varchar,
      "slug" varchar
    );
  `)

  // Create content_plans_content_items_keywords table if it doesn't exist
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "content_plans_content_items_keywords" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "keyword" varchar
    );
  `)

  // Add foreign key constraints
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "content_plans_content_items" ADD CONSTRAINT "content_plans_content_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "content_plans"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "content_plans_content_items_keywords" ADD CONSTRAINT "content_plans_content_items_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "content_plans_content_items"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  // Create indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "content_plans_content_items_order_idx" ON "content_plans_content_items" ("_order");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "content_plans_content_items_parent_id_idx" ON "content_plans_content_items" ("_parent_id");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "content_plans_content_items_keywords_order_idx" ON "content_plans_content_items_keywords" ("_order");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "content_plans_content_items_keywords_parent_id_idx" ON "content_plans_content_items_keywords" ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "content_plans_content_items_keywords";`)
  await db.execute(sql`DROP TABLE IF EXISTS "content_plans_content_items";`)
}