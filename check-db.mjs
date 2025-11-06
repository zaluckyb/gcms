import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const connectionString = process.env.DATABASE_URI

if (!connectionString) {
  console.error('[check-db] No DATABASE_URI found in environment')
  console.log('[check-db] Available env vars (DB*):', Object.keys(process.env).filter(k => k.includes('DB') || k.includes('DATABASE')))
  process.exit(1)
}

async function run() {
  const pool = new Pool({ connectionString })
  const client = await pool.connect()
  try {
    console.log('Connected to database')

    // List matching tables
    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'content_plans%'
      ORDER BY table_name;
    `)
    console.log('\nPublic tables (content_plans%):')
    for (const r of tablesRes.rows) console.log(' -', r.table_name)

    // Describe main table
    const colsRes = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'content_plans_content_items'
      ORDER BY ordinal_position;
    `)

    console.log('\nColumns in content_plans_content_items:')
    for (const r of colsRes.rows) console.log(` - ${r.column_name}: ${r.data_type}`)

    const expected = ['image_prompt_1','image_prompt_2','image_prompt_3','image_prompt_4','image_prompt_5']
    const present = new Set(colsRes.rows.map(r => r.column_name))
    const missing = expected.filter(c => !present.has(c))

    console.log('\nImage prompt columns status:')
    if (missing.length === 0) {
      console.log(' ✅ All image_prompt_1..5 columns exist')

      // Count non-null values per column and any non-null across image_prompt_1..5
      const counts = await client.query(`
        SELECT
          COUNT(*)::int AS total,
          SUM((image_prompt_1 IS NOT NULL)::int)::int AS c1,
          SUM((image_prompt_2 IS NOT NULL)::int)::int AS c2,
          SUM((image_prompt_3 IS NOT NULL)::int)::int AS c3,
          SUM((image_prompt_4 IS NOT NULL)::int)::int AS c4,
          SUM((image_prompt_5 IS NOT NULL)::int)::int AS c5,
          SUM(((image_prompt_1 IS NOT NULL)
            OR (image_prompt_2 IS NOT NULL)
            OR (image_prompt_3 IS NOT NULL)
            OR (image_prompt_4 IS NOT NULL)
            OR (image_prompt_5 IS NOT NULL))::int)::int AS any_non_null
        FROM content_plans_content_items;
      `)
      const row = counts.rows[0]
      console.log(`\nImage prompt data counts:`)
      console.log(` - total items: ${row.total}`)
      console.log(` - image_prompt_1: ${row.c1}`)
      console.log(` - image_prompt_2: ${row.c2}`)
      console.log(` - image_prompt_3: ${row.c3}`)
      console.log(` - image_prompt_4: ${row.c4}`)
      console.log(` - image_prompt_5: ${row.c5}`)
      console.log(` - any non-null: ${row.any_non_null}`)

      // Show a small sample of items that have any image prompt populated
      const sample = await client.query(`
        SELECT id, title,
               image_prompt_1, image_prompt_2, image_prompt_3, image_prompt_4, image_prompt_5
        FROM content_plans_content_items
        WHERE image_prompt_1 IS NOT NULL
           OR image_prompt_2 IS NOT NULL
           OR image_prompt_3 IS NOT NULL
           OR image_prompt_4 IS NOT NULL
           OR image_prompt_5 IS NOT NULL
        ORDER BY id
        LIMIT 5;
      `)
      console.log('\nSample items with image prompts (up to 5):')
      if (sample.rows.length === 0) {
        console.log(' - none')
      } else {
        for (const r of sample.rows) {
          const present = ['1','2','3','4','5'].filter(i => r[`image_prompt_${i}`] != null).join(',')
          console.log(` - ${r.id} | ${r.title ?? ''} | prompts: ${present}`)
        }
      }
    } else {
      console.log(' ⚠️ Missing columns:', missing.join(', '))
    }

    // Describe keywords table if exists
    const kwExists = tablesRes.rows.some(r => r.table_name === 'content_plans_content_items_keywords')
    if (kwExists) {
      const kwCols = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'content_plans_content_items_keywords'
        ORDER BY ordinal_position;
      `)
      console.log('\nColumns in content_plans_content_items_keywords:')
      for (const r of kwCols.rows) console.log(` - ${r.column_name}: ${r.data_type}`)
    }
  } catch (err) {
    console.error('Error checking DB:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

run()