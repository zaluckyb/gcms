import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    ALTER TABLE "content_plans_items" 
    ADD COLUMN IF NOT EXISTS "prompt" TEXT,
    ADD COLUMN IF NOT EXISTS "audience" TEXT,
    ADD COLUMN IF NOT EXISTS "goal" TEXT,
    ADD COLUMN IF NOT EXISTS "region" TEXT,
    ADD COLUMN IF NOT EXISTS "word_count" INTEGER;
  `)
  
  console.log('✅ Added new content items fields to content_plans_items table')
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    ALTER TABLE "content_plans_items" 
    DROP COLUMN IF EXISTS "prompt",
    DROP COLUMN IF EXISTS "audience",
    DROP COLUMN IF EXISTS "goal",
    DROP COLUMN IF EXISTS "region",
    DROP COLUMN IF EXISTS "word_count";
  `)
  
  console.log('✅ Removed content items fields from content_plans_items table')
}