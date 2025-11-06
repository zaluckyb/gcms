import config from '@payload-config'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'

export const GET = async (): Promise<Response> => {
  const payload = await getPayload({ config })
  try {
    // Main table: contentPlans
    await payload.db.drizzle.execute(sql`
      CREATE TABLE IF NOT EXISTS "contentPlans" (
        "id" serial PRIMARY KEY,
        "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
        "created_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
        "name" varchar,
        "start_date" timestamp(3) with time zone,
        "topic" varchar,
        "audience" varchar,
        "days" integer,
        "end_date" timestamp(3) with time zone,
        "strategy_notes" varchar,
        "status" varchar,
        "owner_id" integer,
        CONSTRAINT contentPlans_owner_fk FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `)

    // Ensure expected columns exist according to Payload collection schema
    await payload.db.drizzle.execute(sql`
      ALTER TABLE "contentPlans"
        ADD COLUMN IF NOT EXISTS "audience" varchar,
        ADD COLUMN IF NOT EXISTS "days" integer,
        ADD COLUMN IF NOT EXISTS "end_date" timestamp(3) with time zone,
        ADD COLUMN IF NOT EXISTS "strategy_notes" varchar,
        ADD COLUMN IF NOT EXISTS "owner_id" integer;
    `)

    // Add FK for owner if it doesn't exist (safe to try create)
    await payload.db.drizzle.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'contentPlans_owner_fk'
        ) THEN
          ALTER TABLE "contentPlans"
            ADD CONSTRAINT contentPlans_owner_fk FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL;
        END IF;
      END$$;
    `)

    await payload.db.drizzle.execute(sql`
      CREATE INDEX IF NOT EXISTS contentPlans_status_idx ON "contentPlans" ("status");
    `)

    // Array: items
    await payload.db.drizzle.execute(sql`
      CREATE TABLE IF NOT EXISTS "contentPlans_items" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL,
        "_order" numeric,
        "day_index" integer,
        "planned_date" timestamp(3) with time zone,
        "title" varchar,
        "writer_prompt" varchar,
        -- New columns to align with Payload collection schema
        "date" timestamp(3) with time zone,
        "slug" varchar,
        "description" varchar,
        "approved" boolean,
        "post_id" integer,
        CONSTRAINT contentPlans_items_parent_fk FOREIGN KEY ("_parent_id") REFERENCES "contentPlans"("id") ON DELETE CASCADE,
        CONSTRAINT contentPlans_items_post_fk FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE SET NULL
      );
    `)

    // Ensure expected columns exist even if table was created earlier with different names
    await payload.db.drizzle.execute(sql`
      ALTER TABLE "contentPlans_items"
        ADD COLUMN IF NOT EXISTS "date" timestamp(3) with time zone,
        ADD COLUMN IF NOT EXISTS "slug" varchar,
        ADD COLUMN IF NOT EXISTS "description" varchar;
    `)

    await payload.db.drizzle.execute(sql`
      CREATE INDEX IF NOT EXISTS contentPlans_items_parent_idx ON "contentPlans_items" ("_parent_id");
    `)

    await payload.db.drizzle.execute(sql`
      CREATE INDEX IF NOT EXISTS contentPlans_items_post_idx ON "contentPlans_items" ("post_id");
    `)

    // Nested array: items.keywords
    await payload.db.drizzle.execute(sql`
      CREATE TABLE IF NOT EXISTS "contentPlans_items_keywords" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL,
        "_order" numeric,
        "keyword" varchar,
        -- New column to match Payload array field schema
        "value" varchar,
        CONSTRAINT contentPlans_items_keywords_parent_fk FOREIGN KEY ("_parent_id") REFERENCES "contentPlans_items"("id") ON DELETE CASCADE
      );
    `)

    // Ensure expected column exists even if table was created earlier with different name
    await payload.db.drizzle.execute(sql`
      ALTER TABLE "contentPlans_items_keywords"
        ADD COLUMN IF NOT EXISTS "value" varchar;
    `)

    await payload.db.drizzle.execute(sql`
      CREATE INDEX IF NOT EXISTS contentPlans_items_keywords_parent_idx ON "contentPlans_items_keywords" ("_parent_id");
    `)

    // Posts: add planned_publish_date to support scheduling
    await payload.db.drizzle.execute(sql`
      ALTER TABLE "posts"
        ADD COLUMN IF NOT EXISTS "planned_publish_date" timestamp(3) with time zone;
    `)

    await payload.db.drizzle.execute(sql`
      CREATE INDEX IF NOT EXISTS posts_planned_publish_date_idx ON "posts" ("planned_publish_date");
    `)

    return Response.json({ ok: true })
  } catch (e) {
    const msg = (e as Error)?.message || String(e)
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 })
  }
}
