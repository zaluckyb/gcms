const { drizzle } = require('drizzle-orm/node-postgres')
const { sql } = require('drizzle-orm')
const { Pool } = require('pg')

// Get database connection info from environment
const connectionString = process.env.DATABASE_URI || process.env.POSTGRES_URL

if (!connectionString) {
  console.error('No database connection string found in environment')
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
      ADD COLUMN IF NOT EXISTS "word_count" INTEGER;
    `)

    console.log('✅ Successfully added new columns to content_plans_content_items table')
    
  } catch (error) {
    console.error('Error adding columns:', error)
  } finally {
    await pool.end()
  }
}

addColumns()