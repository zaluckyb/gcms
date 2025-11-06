import config from '@payload-config'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'

export const GET = async (): Promise<Response> => {
  const payload = await getPayload({ config })
  try {
    await payload.db.drizzle.execute(sql`
      ALTER TABLE "payload_locked_documents_rels"
        ADD COLUMN IF NOT EXISTS "tags_id" integer,
        ADD COLUMN IF NOT EXISTS "categories_id" integer,
        ADD COLUMN IF NOT EXISTS "personas_id" integer,
        ADD COLUMN IF NOT EXISTS "content_plans_id" integer,
        ADD COLUMN IF NOT EXISTS "content_plan_transactions_id" integer;
    `)

    await payload.db.drizzle.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_tags_fk'
        ) THEN
          ALTER TABLE "payload_locked_documents_rels"
            ADD CONSTRAINT payload_locked_documents_rels_tags_fk FOREIGN KEY ("tags_id") REFERENCES "tags"("id") ON DELETE CASCADE;
        END IF;
      END$$;
    `)

    await payload.db.drizzle.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_categories_fk'
        ) THEN
          ALTER TABLE "payload_locked_documents_rels"
            ADD CONSTRAINT payload_locked_documents_rels_categories_fk FOREIGN KEY ("categories_id") REFERENCES "categories"("id") ON DELETE CASCADE;
        END IF;
      END$$;
    `)

    await payload.db.drizzle.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_personas_fk'
        ) THEN
          ALTER TABLE "payload_locked_documents_rels"
            ADD CONSTRAINT payload_locked_documents_rels_personas_fk FOREIGN KEY ("personas_id") REFERENCES "personas"("id") ON DELETE CASCADE;
        END IF;
      END$$;
    `)

    // Ensure content_plans FK references snake_case table
    await payload.db.drizzle.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_content_plans_fk'
        ) THEN
          ALTER TABLE "payload_locked_documents_rels"
            DROP CONSTRAINT payload_locked_documents_rels_content_plans_fk;
        END IF;
      END$$;
    `)
    await payload.db.drizzle.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_content_plans_fk'
        ) THEN
          ALTER TABLE "payload_locked_documents_rels"
            ADD CONSTRAINT payload_locked_documents_rels_content_plans_fk FOREIGN KEY ("content_plans_id") REFERENCES "content_plans"("id") ON DELETE CASCADE;
        END IF;
      END$$;
    `)

    await payload.db.drizzle.execute(sql`
      CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_tags_id_idx ON "payload_locked_documents_rels" ("tags_id");
    `)

    await payload.db.drizzle.execute(sql`
      CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_categories_id_idx ON "payload_locked_documents_rels" ("categories_id");
    `)

    await payload.db.drizzle.execute(sql`
      CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_personas_id_idx ON "payload_locked_documents_rels" ("personas_id");
    `)

    await payload.db.drizzle.execute(sql`
      CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_content_plans_id_idx ON "payload_locked_documents_rels" ("content_plans_id");
    `)

    // Add foreign key constraint for content_plan_transactions_id (only if table exists)
    await payload.db.drizzle.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_plan_transactions') THEN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_content_plan_transactions_fk'
          ) THEN
            ALTER TABLE "payload_locked_documents_rels"
              ADD CONSTRAINT payload_locked_documents_rels_content_plan_transactions_fk FOREIGN KEY ("content_plan_transactions_id") REFERENCES "content_plan_transactions"("id") ON DELETE CASCADE;
          END IF;
        END IF;
      END$$;
    `)

    await payload.db.drizzle.execute(sql`
      CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_content_plan_transactions_id_idx ON "payload_locked_documents_rels" ("content_plan_transactions_id");
    `)

    return Response.json({ ok: true })
  } catch (e) {
    const msg = (e as Error)?.message || String(e)
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 })
  }
}
