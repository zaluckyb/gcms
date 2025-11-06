// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
// import sharp from 'sharp'

import { Users } from './collections/Users'
import { Personas } from './collections/Personas'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Tags } from './collections/Tags'
import { Categories } from './collections/Categories'
import { ContentPlans } from './collections/ContentPlans'
import { ContentPlanTransactions } from './collections/ContentPlanTransactions'
import { Site } from './globals/Site'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  onInit: async (payload) => {
    console.log('🚀 Payload CMS initialized successfully')
    try {
      // Ensure child table column for ContentPlans items: add text column "post" if missing
      const sql = `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'content_plans_items' AND column_name = 'post'
          ) THEN
            ALTER TABLE "content_plans_items" ADD COLUMN "post" text;
            -- If legacy column exists, backfill values
            IF EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'content_plans_items' AND column_name = 'post_id'
            ) THEN
              UPDATE "content_plans_items" SET "post" = "post_id"::text WHERE "post_id" IS NOT NULL;
            END IF;
          END IF;
        END $$;
        CREATE INDEX IF NOT EXISTS "content_plans_items_post_idx" ON "content_plans_items" ("post");

        DO $$
        BEGIN
          -- Ensure posts.post_content_draft column exists for the new field
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'posts' AND column_name = 'post_content_draft'
          ) THEN
            ALTER TABLE "posts" ADD COLUMN "post_content_draft" text;
          END IF;
        END $$;
      `
      await payload.db.pool.query(sql)
      console.log('✅ Ensured content_plans_items.post column exists (text) and indexed')
      console.log('✅ Ensured posts.post_content_draft column exists (text)')
    } catch (e) {
      console.error('❌ Failed to ensure content_plans_items.post column', e)
    }
  },
  collections: [Users, Media, Posts, Tags, Categories, Personas, ContentPlans, ContentPlanTransactions],
  globals: [Site],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    // Prevent automatic dev-time schema push to avoid init errors
    push: false,
  }),
  // sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
