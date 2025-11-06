import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

async function run() {
  const connectionString = process.env.DATABASE_URI
  if (!connectionString) {
    console.error('[create-image-prompts-table] DATABASE_URI not set')
    process.exit(1)
  }

  const pool = new Pool({ connectionString })
  const client = await pool.connect()
  try {
    console.log('Connected to DB, creating content_plans_content_items_image_prompts table if missing...')

    await client.query(`
      CREATE TABLE IF NOT EXISTS "content_plans_content_items_image_prompts" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "prompt" text
      );
    `)

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "content_plans_content_items_image_prompts" ADD CONSTRAINT "content_plans_content_items_image_prompts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "content_plans_content_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS "content_plans_content_items_image_prompts_order_idx" ON "content_plans_content_items_image_prompts" ("_order");
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS "content_plans_content_items_image_prompts_parent_id_idx" ON "content_plans_content_items_image_prompts" ("_parent_id");
    `)

    const check = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'content_plans_content_items_image_prompts';
    `)

    if (check.rows.length === 1) {
      console.log('✅ Table content_plans_content_items_image_prompts is present')
    } else {
      console.log('⚠️ Table content_plans_content_items_image_prompts not found after creation attempt')
    }
  } catch (e) {
    console.error('Error creating image_prompts table:', e)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

run()