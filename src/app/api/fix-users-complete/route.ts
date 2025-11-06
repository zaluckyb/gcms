import config from '@payload-config'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'

export const GET = async (): Promise<Response> => {
  const payload = await getPayload({ config })
  
  try {
    console.log('🔧 Starting complete users table fix...')

    // 1. Add missing role column to users table
    await payload.db.drizzle.execute(sql`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "role" varchar DEFAULT 'user';
    `)
    console.log('✅ Added role column to users table')

    // 2. Ensure personas table exists
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
    console.log('✅ Ensured personas table exists')

    // 3. Create personas index
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
    console.log('✅ Created personas name index')

    // 4. Create personas_strengths table
    await payload.db.drizzle.execute(sql`
      CREATE TABLE IF NOT EXISTS "personas_strengths" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL,
        "_order" numeric,
        "value" varchar NOT NULL,
        CONSTRAINT personas_strengths_parent_fk FOREIGN KEY ("_parent_id") REFERENCES "personas"("id") ON DELETE CASCADE
      );
    `)
    console.log('✅ Created personas_strengths table')

    // 5. Create personas_uses table
    await payload.db.drizzle.execute(sql`
      CREATE TABLE IF NOT EXISTS "personas_uses" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL,
        "_order" numeric,
        "value" varchar NOT NULL,
        CONSTRAINT personas_uses_parent_fk FOREIGN KEY ("_parent_id") REFERENCES "personas"("id") ON DELETE CASCADE
      );
    `)
    console.log('✅ Created personas_uses table')

    // 6. Add persona columns to users table
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
    console.log('✅ Added persona columns to users table')

    // 7. Add foreign key constraint
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
    console.log('✅ Added foreign key constraint')

    // 8. Create users_persona_profile_strengths table
    await payload.db.drizzle.execute(sql`
      CREATE TABLE IF NOT EXISTS "users_persona_profile_strengths" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL,
        "_order" numeric,
        "value" varchar NOT NULL,
        CONSTRAINT users_persona_profile_strengths_parent_fk FOREIGN KEY ("_parent_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `)
    console.log('✅ Created users_persona_profile_strengths table')

    // 9. Create users_persona_profile_uses table
    await payload.db.drizzle.execute(sql`
      CREATE TABLE IF NOT EXISTS "users_persona_profile_uses" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL,
        "_order" numeric,
        "value" varchar NOT NULL,
        CONSTRAINT users_persona_profile_uses_parent_fk FOREIGN KEY ("_parent_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `)
    console.log('✅ Created users_persona_profile_uses table')

    // 10. Create users_sessions table
    await payload.db.drizzle.execute(sql`
      CREATE TABLE IF NOT EXISTS "users_sessions" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL,
        "_order" numeric,
        "created_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
        "expires_at" timestamp(3) with time zone,
        CONSTRAINT users_sessions_parent_fk FOREIGN KEY ("_parent_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `)
    console.log('✅ Created users_sessions table')

    // 11. Update existing users to have default role if null
    await payload.db.drizzle.execute(sql`
      UPDATE "users" SET "role" = 'user' WHERE "role" IS NULL;
    `)
    console.log('✅ Updated existing users with default role')

    console.log('🎉 Complete users table fix completed successfully!')

    return Response.json({ 
      success: true, 
      message: 'Complete users table schema fix applied successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Complete users fix error:', error)
    return Response.json({
      success: false,
      error: (error as Error)?.message || String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}