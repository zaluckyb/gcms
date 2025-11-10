import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// Create DB tables for the Payload Global: "header"
// Fields: logo (relation to media) and navLinks[] (label, href, external, highlight)
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create main global table
    CREATE TABLE IF NOT EXISTS "header" (
      "id" serial PRIMARY KEY,
      "logo_id" integer,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Relationship to media for logo
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

    -- Create child table for navLinks array
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

    -- FK to parent global row
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

    -- Helpful indexes
    CREATE INDEX IF NOT EXISTS "header_nav_links_parent_idx" ON "header_nav_links" ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "header_nav_links";
    DROP TABLE IF EXISTS "header";
  `)
}