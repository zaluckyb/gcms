import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ADD COLUMN "post_content_draft" varchar;
  ALTER TABLE "content_plans_content_items" ADD COLUMN "prompt" varchar;
  ALTER TABLE "content_plans_content_items" ADD COLUMN "audience" varchar;
  ALTER TABLE "content_plans_content_items" ADD COLUMN "goal" varchar;
  ALTER TABLE "content_plans_content_items" ADD COLUMN "region" varchar;
  ALTER TABLE "content_plans_content_items" ADD COLUMN "word_count" numeric;`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" DROP COLUMN "post_content_draft";
  ALTER TABLE "content_plans_content_items" DROP COLUMN "prompt";
  ALTER TABLE "content_plans_content_items" DROP COLUMN "audience";
  ALTER TABLE "content_plans_content_items" DROP COLUMN "goal";
  ALTER TABLE "content_plans_content_items" DROP COLUMN "region";
  ALTER TABLE "content_plans_content_items" DROP COLUMN "word_count";`)
}
