require('dotenv').config()
const payload = require('payload')

async function run() {
  try {
    await payload.init({
      secret: process.env.PAYLOAD_SECRET || '',
      local: true,
    })

    const sql = `
      CREATE TABLE IF NOT EXISTS "header" (
        "id" serial PRIMARY KEY,
        "logo_id" integer,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'header_logo_id_media_id_fk'
        ) THEN
          ALTER TABLE "header"
            ADD CONSTRAINT "header_logo_id_media_id_fk"
            FOREIGN KEY ("logo_id") REFERENCES "media"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS "header_nav_links" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL,
        "label" varchar,
        "href" varchar,
        "external" boolean DEFAULT false,
        "highlight" boolean DEFAULT false,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'header_nav_links_parent_id_fk'
        ) THEN
          ALTER TABLE "header_nav_links"
            ADD CONSTRAINT "header_nav_links_parent_id_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "header"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;

      CREATE INDEX IF NOT EXISTS "header_nav_links_parent_idx" ON "header_nav_links" ("_parent_id");
    `

    await payload.db.pool.query(sql)
    console.log('✅ Header global tables ensured')
  } catch (e) {
    console.error('❌ Failed to create Header tables', e)
    process.exitCode = 1
  } finally {
    process.exit(0)
  }
}

run()