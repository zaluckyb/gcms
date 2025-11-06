import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// Drops legacy image_prompt_1..5 columns from content_plans_content_items
// Safe/idempotent: uses IF EXISTS for all operations
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "content_plans_content_items"
      DROP COLUMN IF EXISTS "image_prompt_1",
      DROP COLUMN IF EXISTS "image_prompt_2",
      DROP COLUMN IF EXISTS "image_prompt_3",
      DROP COLUMN IF EXISTS "image_prompt_4",
      DROP COLUMN IF EXISTS "image_prompt_5";
  `)
}

// Restores the columns as TEXT if needed (no defaults/backfills)
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "content_plans_content_items"
      ADD COLUMN IF NOT EXISTS "image_prompt_1" text,
      ADD COLUMN IF NOT EXISTS "image_prompt_2" text,
      ADD COLUMN IF NOT EXISTS "image_prompt_3" text,
      ADD COLUMN IF NOT EXISTS "image_prompt_4" text,
      ADD COLUMN IF NOT EXISTS "image_prompt_5" text;
  `)
}