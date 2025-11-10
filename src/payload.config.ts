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
import { Header } from './globals/Header'
import { Footer } from './globals/Footer'

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
      // Consolidated safe SQL: ensure posts column and Header tables only
      const sql = `
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

        -- Ensure Header global tables exist
        CREATE TABLE IF NOT EXISTS "header" (
          "id" serial PRIMARY KEY,
          "logo_id" integer,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        -- Ensure new logo dimension columns exist on header
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'header' AND column_name = 'logo_width'
          ) THEN
            ALTER TABLE "header" ADD COLUMN "logo_width" integer DEFAULT 400;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'header' AND column_name = 'logo_height'
          ) THEN
            ALTER TABLE "header" ADD COLUMN "logo_height" integer DEFAULT 200;
          END IF;
        END $$;

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
          "_order" integer DEFAULT 0,
          "label" varchar,
          "href" varchar,
          "external" boolean DEFAULT false,
          "highlight" boolean DEFAULT false,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        -- Ensure header_nav_links.id is varchar to match Payload array item IDs
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'header_nav_links' AND column_name = 'id' AND data_type <> 'character varying'
          ) THEN
            ALTER TABLE "header_nav_links" ALTER COLUMN "id" TYPE varchar USING "id"::varchar;
          END IF;
        END $$;

        -- Ensure _order column on header_nav_links for array ordering
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'header_nav_links' AND column_name = '_order'
          ) THEN
            ALTER TABLE "header_nav_links" ADD COLUMN "_order" integer DEFAULT 0;
          END IF;
        END $$;

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

        -- Seed a default header row if none exists
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM "header") THEN
            INSERT INTO "header" (logo_width, logo_height) VALUES (400, 200);
          END IF;
        END $$;

        -- Ensure Footer global table exists with required columns
        CREATE TABLE IF NOT EXISTS "footer" (
          "id" serial PRIMARY KEY,
          "global_type" varchar DEFAULT 'footer' NOT NULL,
          "copyright_text" varchar,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        -- Ensure global_type column exists on pre-existing tables
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'footer' AND column_name = 'global_type'
          ) THEN
            ALTER TABLE "footer" ADD COLUMN "global_type" varchar DEFAULT 'footer' NOT NULL;
          END IF;
        END $$;

        -- Ensure unique constraint on global_type for single-row global
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'footer_global_type_unique'
          ) THEN
            ALTER TABLE "footer"
              ADD CONSTRAINT "footer_global_type_unique" UNIQUE ("global_type");
          END IF;
        END $$;

        -- footer.footerLinks array
        CREATE TABLE IF NOT EXISTS "footer_footer_links" (
          "id" serial PRIMARY KEY,
          "_parent_id" integer NOT NULL,
          "_order" integer DEFAULT 0,
          "label" varchar,
          "href" varchar,
          "external" boolean DEFAULT false,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        -- Ensure footer_footer_links.id is varchar to match Payload array item IDs
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'footer_footer_links' AND column_name = 'id' AND data_type <> 'character varying'
          ) THEN
            ALTER TABLE "footer_footer_links" ALTER COLUMN "id" TYPE varchar USING "id"::varchar;
          END IF;
        END $$;

        -- Ensure _order column exists for footer_footer_links
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'footer_footer_links' AND column_name = '_order'
          ) THEN
            ALTER TABLE "footer_footer_links" ADD COLUMN "_order" integer DEFAULT 0;
          END IF;
        END $$;

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'footer_footer_links_parent_id_fk'
          ) THEN
            ALTER TABLE "footer_footer_links"
              ADD CONSTRAINT "footer_footer_links_parent_id_fk"
              FOREIGN KEY ("_parent_id") REFERENCES "footer"("id")
              ON DELETE CASCADE ON UPDATE NO ACTION;
          END IF;
        END $$;

        CREATE INDEX IF NOT EXISTS "footer_footer_links_parent_idx" ON "footer_footer_links" ("_parent_id");

        -- footer.legalLinks array
        CREATE TABLE IF NOT EXISTS "footer_legal_links" (
          "id" serial PRIMARY KEY,
          "_parent_id" integer NOT NULL,
          "_order" integer DEFAULT 0,
          "label" varchar,
          "href" varchar,
          "external" boolean DEFAULT false,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        -- Ensure footer_legal_links.id is varchar to match Payload array item IDs
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'footer_legal_links' AND column_name = 'id' AND data_type <> 'character varying'
          ) THEN
            ALTER TABLE "footer_legal_links" ALTER COLUMN "id" TYPE varchar USING "id"::varchar;
          END IF;
        END $$;

        -- Ensure _order column exists for footer_legal_links
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'footer_legal_links' AND column_name = '_order'
          ) THEN
            ALTER TABLE "footer_legal_links" ADD COLUMN "_order" integer DEFAULT 0;
          END IF;
        END $$;

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'footer_legal_links_parent_id_fk'
          ) THEN
            ALTER TABLE "footer_legal_links"
              ADD CONSTRAINT "footer_legal_links_parent_id_fk"
              FOREIGN KEY ("_parent_id") REFERENCES "footer"("id")
              ON DELETE CASCADE ON UPDATE NO ACTION;
          END IF;
        END $$;

        CREATE INDEX IF NOT EXISTS "footer_legal_links_parent_idx" ON "footer_legal_links" ("_parent_id");

        -- Seed a default footer row if none exists
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM "footer") THEN
            INSERT INTO "footer" (global_type, copyright_text)
            VALUES ('footer', '© 2025 Web Developer. All rights reserved.');
          END IF;
        END $$;
      `
      await payload.db.pool.query(sql)
      console.log('✅ Ensured posts.post_content_draft column exists (text)')
      console.log('✅ Ensured Header global tables/columns exist and seeded default row')
      console.log('✅ Ensured Footer global tables/columns exist and seeded default row')

      // Ensure Footer global document exists via Payload API (in addition to raw SQL)
      try {
        await payload.findGlobal({ slug: 'footer' })
      } catch {
        await payload.updateGlobal({
          slug: 'footer',
          data: {
            copyrightText: '© 2025 Web Developer. All rights reserved.',
            footerLinks: [
              { label: 'Solutions', href: '/solutions' },
              { label: 'Portfolio', href: '/portfolio' },
              { label: 'Blog', href: '/posts' },
            ],
            legalLinks: [
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
            ],
          },
        })
        console.log('✅ Seeded Footer global document via Payload API')
      }
    } catch (e) {
      console.error('❌ Failed to run onInit DB setup', e)
    }
  },
  collections: [Users, Media, Posts, Tags, Categories, Personas, ContentPlans, ContentPlanTransactions],
  globals: [Site, Header, Footer],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'dev-secret',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    // Keep automatic schema push disabled; we run targeted migrations instead
    push: false,
  }),
  // sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
