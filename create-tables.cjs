const { Pool } = require('pg')
require('dotenv').config()

async function createTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI
  })

  try {
    // Create content_plans_content_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "content_plans_content_items" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "title" varchar,
        "description" varchar,
        "slug" varchar
      );
    `)

    // Create content_plans_content_items_keywords table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "content_plans_content_items_keywords" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "keyword" varchar
      );
    `)

    // Add foreign key constraints
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "content_plans_content_items" ADD CONSTRAINT "content_plans_content_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "content_plans"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "content_plans_content_items_keywords" ADD CONSTRAINT "content_plans_content_items_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "content_plans_content_items"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS "content_plans_content_items_order_idx" ON "content_plans_content_items" ("_order");`)
    await pool.query(`CREATE INDEX IF NOT EXISTS "content_plans_content_items_parent_id_idx" ON "content_plans_content_items" ("_parent_id");`)
    await pool.query(`CREATE INDEX IF NOT EXISTS "content_plans_content_items_keywords_order_idx" ON "content_plans_content_items_keywords" ("_order");`)
    await pool.query(`CREATE INDEX IF NOT EXISTS "content_plans_content_items_keywords_parent_id_idx" ON "content_plans_content_items_keywords" ("_parent_id");`)

    console.log('Tables created successfully!')
  } catch (error) {
    console.error('Error creating tables:', error)
  } finally {
    await pool.end()
  }
}

createTables()