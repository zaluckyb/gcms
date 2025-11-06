import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { sql } from 'drizzle-orm'
import pg from 'pg'
const { Pool } = pg

// Get database connection info from environment
const connectionString = process.env.DATABASE_URI

if (!connectionString) {
  console.error('No database connection string found in environment')
  console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('DB') || key.includes('DATABASE')))
  process.exit(1)
}

async function addColumns() {
  const pool = new Pool({
    connectionString,
  })

  try {
    console.log('Connecting to database...')
    const db = drizzle(pool)

    console.log('Adding new columns to content_plans_content_items table...')
    
    await db.execute(sql`
      ALTER TABLE "content_plans_content_items" 
      ADD COLUMN IF NOT EXISTS "prompt" TEXT,
      ADD COLUMN IF NOT EXISTS "audience" TEXT,
      ADD COLUMN IF NOT EXISTS "goal" TEXT,
      ADD COLUMN IF NOT EXISTS "region" TEXT,
      ADD COLUMN IF NOT EXISTS "word_count" INTEGER,
      ADD COLUMN IF NOT EXISTS "image_prompt_1" TEXT,
      ADD COLUMN IF NOT EXISTS "image_prompt_2" TEXT,
      ADD COLUMN IF NOT EXISTS "image_prompt_3" TEXT,
      ADD COLUMN IF NOT EXISTS "image_prompt_4" TEXT,
      ADD COLUMN IF NOT EXISTS "image_prompt_5" TEXT;
    `)

    console.log('✅ Successfully added new columns to content_plans_content_items table')
    
  } catch (error) {
    console.error('Error adding columns:', error)
  } finally {
    await pool.end()
  }
}

addColumns()