import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Client } = pg

async function addItemsJson() {
  const client = new Client({
    connectionString: process.env.DATABASE_URI,
  })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    const exists = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'content_plans' AND column_name = 'items_json'`
    )

    if (exists.rows.length > 0) {
      console.log('ℹ️ items_json column already exists in content_plans')
      return
    }

    console.log('🛠️ Adding items_json column to content_plans...')
    await client.query(`ALTER TABLE content_plans ADD COLUMN items_json jsonb`)
    console.log('✅ items_json column added successfully')
  } catch (error) {
    console.error('❌ Error adding items_json:', error.message)
    console.error(error.stack)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

addItemsJson()