import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Convert contentPlans_items.post_id from integer to text and add an index
  await db.execute(sql`
    DO $$
    BEGIN
      -- Change column type to text safely
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contentPlans_items' AND column_name = 'post_id' AND data_type = 'integer'
      ) THEN
        ALTER TABLE "contentPlans_items"
          ALTER COLUMN "post_id" TYPE text USING "post_id"::text;
      END IF;

      -- Create index on post_id if it does not exist
      IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'contentPlans_items_post_id_idx' AND n.nspname = 'public'
      ) THEN
        CREATE INDEX "contentPlans_items_post_id_idx" ON "contentPlans_items" ("post_id");
      END IF;
    END
    $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Revert contentPlans_items.post_id back to integer when safe
  await db.execute(sql`
    DO $$
    BEGIN
      -- Drop the text index if it exists
      IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'contentPlans_items_post_id_idx' AND n.nspname = 'public'
      ) THEN
        DROP INDEX IF EXISTS "contentPlans_items_post_id_idx";
      END IF;

      -- Change column type back to integer, non-numeric strings become NULL
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contentPlans_items' AND column_name = 'post_id' AND data_type = 'text'
      ) THEN
        ALTER TABLE "contentPlans_items"
          ALTER COLUMN "post_id" TYPE integer 
          USING (CASE WHEN "post_id" ~ '^[0-9]+$' THEN "post_id"::integer ELSE NULL END);
      END IF;
    END
    $$;
  `)
}