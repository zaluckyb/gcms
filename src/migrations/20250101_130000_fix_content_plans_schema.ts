import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    -- Add missing columns to content_plans table
    ALTER TABLE content_plans 
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS content_plan_description JSONB,
    ADD COLUMN IF NOT EXISTS notes TEXT;
    
    -- Remove old columns that are no longer needed
    ALTER TABLE content_plans 
    DROP COLUMN IF EXISTS audience,
    DROP COLUMN IF EXISTS days,
    DROP COLUMN IF EXISTS strategy_notes,
    DROP COLUMN IF EXISTS items_json;
  `)
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    -- Revert changes - add back old columns
    ALTER TABLE content_plans 
    ADD COLUMN IF NOT EXISTS audience VARCHAR,
    ADD COLUMN IF NOT EXISTS days INTEGER,
    ADD COLUMN IF NOT EXISTS strategy_notes VARCHAR,
    ADD COLUMN IF NOT EXISTS items_json JSONB;
    
    -- Remove new columns
    ALTER TABLE content_plans 
    DROP COLUMN IF EXISTS description,
    DROP COLUMN IF EXISTS content_plan_description,
    DROP COLUMN IF EXISTS notes;
  `)
}