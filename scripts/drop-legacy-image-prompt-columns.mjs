import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const connectionString = process.env.DATABASE_URI
if (!connectionString) {
  console.error('[drop-legacy-image-prompts] No DATABASE_URI found in environment')
  process.exit(1)
}

async function run() {
  const pool = new Pool({ connectionString })
  const client = await pool.connect()
  try {
    console.log('Connected to database')

    const checkCols = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'content_plans_content_items'
        AND column_name IN ('image_prompt_1','image_prompt_2','image_prompt_3','image_prompt_4','image_prompt_5')
      ORDER BY column_name;
    `)

    const existing = checkCols.rows.map(r => r.column_name)
    if (existing.length === 0) {
      console.log('✅ No legacy image_prompt_1..5 columns found. Nothing to drop.')
      return
    }

    console.log('Legacy columns present:', existing.join(', '))

    const dropSql = `
      ALTER TABLE "content_plans_content_items"
      ${existing.map((c) => `DROP COLUMN IF EXISTS "${c}"`).join(',\n      ')};
    `

    console.log('Dropping legacy columns...')
    await client.query(dropSql)
    console.log('✅ Dropped legacy image_prompt_1..5 columns (idempotent)')

    const verify = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'content_plans_content_items'
        AND column_name IN ('image_prompt_1','image_prompt_2','image_prompt_3','image_prompt_4','image_prompt_5');
    `)

    if (verify.rows.length === 0) {
      console.log('✅ Verification passed: legacy columns no longer exist')
    } else {
      console.warn('⚠️ Verification found remaining columns:', verify.rows.map(r => r.column_name))
    }
  } catch (err) {
    console.error('❌ Error dropping legacy columns:', err)
    process.exitCode = 1
  } finally {
    try { client.release() } catch {}
    try { await pool.end() } catch {}
  }
}

run().catch((e) => {
  console.error('❌ Script failed:', e)
  process.exit(1)
})