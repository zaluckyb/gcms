import config from '@payload-config'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'

export const GET = async (): Promise<Response> => {
  const payload = await getPayload({ config })
  try {
    await payload.db.drizzle.execute(sql`
      CREATE TABLE IF NOT EXISTS "personas" (
        "id" serial PRIMARY KEY,
        "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
        "created_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
        "name" varchar NOT NULL,
        "category" varchar,
        "focus" varchar,
        "personality_tone" varchar,
        "personality_voice_style" varchar,
        "personality_motivations" varchar,
        "personality_audience_perception" varchar
      );
    `)

    await payload.db.drizzle.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'personas' AND indexname = 'personas_name_idx'
        ) THEN
          CREATE UNIQUE INDEX personas_name_idx ON "personas" ("name");
        END IF;
      END$$;
    `)

    await payload.db.drizzle.execute(sql`
      CREATE TABLE IF NOT EXISTS "personas_strengths" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL,
        "_order" numeric,
        "value" varchar NOT NULL,
        CONSTRAINT personas_strengths_parent_fk FOREIGN KEY ("_parent_id") REFERENCES "personas"("id") ON DELETE CASCADE
      );
    `)

    await payload.db.drizzle.execute(sql`
      CREATE TABLE IF NOT EXISTS "personas_uses" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL,
        "_order" numeric,
        "value" varchar NOT NULL,
        CONSTRAINT personas_uses_parent_fk FOREIGN KEY ("_parent_id") REFERENCES "personas"("id") ON DELETE CASCADE
      );
    `)

    await payload.db.drizzle.execute(sql`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "persona_selected_persona_id" integer,
        ADD COLUMN IF NOT EXISTS "persona_profile_name" varchar,
        ADD COLUMN IF NOT EXISTS "persona_profile_category" varchar,
        ADD COLUMN IF NOT EXISTS "persona_profile_focus" varchar,
        ADD COLUMN IF NOT EXISTS "persona_profile_personality_tone" varchar,
        ADD COLUMN IF NOT EXISTS "persona_profile_personality_voice_style" varchar,
        ADD COLUMN IF NOT EXISTS "persona_profile_personality_motivations" varchar,
        ADD COLUMN IF NOT EXISTS "persona_profile_personality_audience_perception" varchar;
    `)

    await payload.db.drizzle.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_persona_selected_persona_fk'
        ) THEN
          ALTER TABLE "users"
            ADD CONSTRAINT users_persona_selected_persona_fk FOREIGN KEY ("persona_selected_persona_id")
            REFERENCES "personas"("id") ON DELETE SET NULL;
        END IF;
      END$$;
    `)

    await payload.db.drizzle.execute(sql`
      CREATE TABLE IF NOT EXISTS "users_persona_profile_strengths" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL,
        "_order" numeric,
        "value" varchar NOT NULL,
        CONSTRAINT users_persona_profile_strengths_parent_fk FOREIGN KEY ("_parent_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `)

    await payload.db.drizzle.execute(sql`
      CREATE TABLE IF NOT EXISTS "users_persona_profile_uses" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL,
        "_order" numeric,
        "value" varchar NOT NULL,
        CONSTRAINT users_persona_profile_uses_parent_fk FOREIGN KEY ("_parent_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `)

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error)?.message || String(e) }, { status: 500 })
  }
}