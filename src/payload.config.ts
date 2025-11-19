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
import { ContactDetails } from './collections/ContactDetails'
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

      const otherTablesSql = `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email'
          ) THEN
            ALTER TABLE "users" ADD COLUMN "email" varchar;
          END IF;
        END $$;

        CREATE TABLE IF NOT EXISTS "media" (
          "id" serial PRIMARY KEY,
          "alt" varchar,
          "filename" varchar,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS "tags" (
          "id" serial PRIMARY KEY,
          "name" varchar,
          "slug" varchar UNIQUE,
          "description" varchar,
          "color" varchar,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS "categories" (
          "id" serial PRIMARY KEY,
          "name" varchar,
          "slug" varchar UNIQUE,
          "description" varchar,
          "color" varchar,
          "parent_id" integer,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'categories_parent_id_fk'
          ) THEN
            ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fk" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE set null ON UPDATE no action;
          END IF;
        END $$;

        CREATE TABLE IF NOT EXISTS "personas" (
          "id" serial PRIMARY KEY,
          "name" varchar,
          "category" varchar,
          "focus" varchar,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS "content_plans" (
          "id" serial PRIMARY KEY,
          "owner_id" integer,
          "status" varchar DEFAULT 'draft',
          "topic" varchar,
          "start_date" timestamp(3) with time zone,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'content_plans_owner_id_users_fk'
          ) THEN
            ALTER TABLE "content_plans" ADD CONSTRAINT "content_plans_owner_id_users_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
          END IF;
        END $$;

        CREATE INDEX IF NOT EXISTS "content_plans_owner_idx" ON "content_plans" ("owner_id");
        CREATE INDEX IF NOT EXISTS "content_plans_status_idx" ON "content_plans" ("status");

        CREATE TABLE IF NOT EXISTS "content_plan_transactions" (
          "id" serial PRIMARY KEY,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns WHERE table_name = 'content_plans' AND column_name = 'id' AND data_type = 'character varying'
          ) THEN
            IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'content_plans_id_seq') THEN
              CREATE SEQUENCE content_plans_id_seq;
            END IF;
            ALTER TABLE "content_plans" ALTER COLUMN "id" DROP DEFAULT;
            ALTER TABLE "content_plans" ALTER COLUMN "id" TYPE integer USING "id"::integer;
            ALTER TABLE "content_plans" ALTER COLUMN "id" SET DEFAULT nextval('content_plans_id_seq');
          END IF;
        END $$;

        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns WHERE table_name = 'content_plan_transactions' AND column_name = 'id' AND data_type = 'character varying'
          ) THEN
            IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'content_plan_transactions_id_seq') THEN
              CREATE SEQUENCE content_plan_transactions_id_seq;
            END IF;
            ALTER TABLE "content_plan_transactions" ALTER COLUMN "id" DROP DEFAULT;
            ALTER TABLE "content_plan_transactions" ALTER COLUMN "id" TYPE integer USING "id"::integer;
            ALTER TABLE "content_plan_transactions" ALTER COLUMN "id" SET DEFAULT nextval('content_plan_transactions_id_seq');
          END IF;
        END $$;
      `
      await payload.db.pool.query(otherTablesSql)
      console.log('✅ Ensured base tables for users-related and content collections exist')

      const infraSql = `
        CREATE TABLE IF NOT EXISTS "payload_preferences" (
          "id" varchar PRIMARY KEY,
          "key" varchar,
          "value" jsonb,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
          "id" varchar PRIMARY KEY,
          "parent_id" varchar NOT NULL,
          "order" integer DEFAULT 0,
          "path" varchar,
          "users_id" integer,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        DO $$
        BEGIN
          PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
          IF NOT FOUND THEN
            CREATE EXTENSION IF NOT EXISTS pgcrypto;
          END IF;
        END $$;

        ALTER TABLE "payload_preferences" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
        ALTER TABLE "payload_preferences_rels" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'payload_preferences_rels_parent_fk'
          ) THEN
            ALTER TABLE "payload_preferences_rels"
              ADD CONSTRAINT payload_preferences_rels_parent_fk FOREIGN KEY ("parent_id") REFERENCES "payload_preferences"("id") ON DELETE CASCADE NOT VALID;
          END IF;
        END$$;

        CREATE INDEX IF NOT EXISTS "payload_preferences_created_idx" ON "payload_preferences" ("created_at");
        CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" ("key");
        CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" ("parent_id");
        CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" ("order");
        CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" ("users_id");

        CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
          "id" varchar PRIMARY KEY,
          "collection_slug" varchar,
          "global_slug" varchar,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
          "id" varchar PRIMARY KEY,
          "parent_id" varchar NOT NULL,
          "order" integer DEFAULT 0,
          "path" varchar,
          "users_id" integer,
          "media_id" integer,
          "posts_id" integer,
          "tags_id" integer,
          "categories_id" integer,
          "personas_id" integer,
          "content_plans_id" integer,
          "content_plan_transactions_id" integer,
          "contact_details_id" integer,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        ALTER TABLE "payload_locked_documents" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
        ALTER TABLE "payload_locked_documents_rels" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_parent_fk'
          ) THEN
            ALTER TABLE "payload_locked_documents_rels"
              ADD CONSTRAINT payload_locked_documents_rels_parent_fk FOREIGN KEY ("parent_id") REFERENCES "payload_locked_documents"("id") ON DELETE CASCADE NOT VALID;
          END IF;
        END$$;

        CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_idx" ON "payload_locked_documents" ("created_at");
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" ("global_slug");
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" ("parent_id");
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" ("order");
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" ("users_id");
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" ("media_id");
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" ("posts_id");
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" ("tags_id");
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" ("categories_id");
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_personas_id_idx" ON "payload_locked_documents_rels" ("personas_id");
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_content_plans_id_idx" ON "payload_locked_documents_rels" ("content_plans_id");
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_content_plan_transactions_id_idx" ON "payload_locked_documents_rels" ("content_plan_transactions_id");
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_contact_details_id_idx" ON "payload_locked_documents_rels" ("contact_details_id");
      `
      await payload.db.pool.query(infraSql)
      console.log('✅ Ensured Payload infra tables exist (preferences, locks, indexes)')

      // Ensure ContactDetails collection base table exists to satisfy admin list view
      const contactSql = `
        CREATE TABLE IF NOT EXISTS "contact_details" (
          "id" varchar PRIMARY KEY,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );
      `
      await payload.db.pool.query(contactSql)
      console.log('✅ Ensured ContactDetails base table exists')

      // Seed a default Contact Details document if none exists
      try {
        const existing = await payload.find({ collection: 'contact-details', limit: 1 })
        if ((existing?.docs?.length ?? 0) === 0) {
          await payload.create({
            collection: 'contact-details',
            data: {
              title: 'WebDeveloper Contact Details',
              organization: {
                orgId: 'https://webdeveloper.co.za/#org',
                name: 'WebDeveloper',
                url: 'https://webdeveloper.co.za/',
                logo: 'https://webdeveloper.co.za/media/webdeveloper-logo.png',
                email: 'hello@webdeveloper.co.za',
                telephone: '+27 87 265 2465',
                areaServed: [
                  { type: 'Country', name: 'ZA' },
                  { type: 'City', name: 'Cape Town' },
                ],
                sameAs: [
                  { url: 'https://twitter.com/webdeveloper' },
                  { url: 'https://www.linkedin.com/company/webdeveloper' },
                  { url: 'https://github.com/webdeveloper' },
                ],
                contactPoint: [
                  {
                    contactType: 'Support',
                    name: 'Customer Support',
                    telephone: '+27 87 265 2465',
                    email: 'support@webdeveloper.co.za',
                    availableLanguage: [{ value: 'en-ZA' }, { value: 'af-ZA' }],
                    areaServed: 'ZA',
                    hoursAvailable: {
                      dayOfWeek: 'Monday',
                      opens: '08:00',
                      closes: '17:00',
                    },
                    url: 'https://webdeveloper.co.za/support',
                  },
                  {
                    contactType: 'Sales',
                    telephone: '+27 87 265 2465',
                    email: 'sales@webdeveloper.co.za',
                    availableLanguage: [{ value: 'en-ZA' }],
                    areaServed: 'ZA',
                    hoursAvailable: {
                      dayOfWeek: 'Tuesday',
                      opens: '09:00',
                      closes: '17:00',
                    },
                    url: 'https://webdeveloper.co.za/contact/sales',
                  },
                ],
                department: [
                  { id: 'https://webdeveloper.co.za/#dept-support' },
                  { id: 'https://webdeveloper.co.za/#dept-sales' },
                ],
              },
              hq: {
                hqId: 'https://webdeveloper.co.za/#hq',
                name: 'WebDeveloper Head Office',
                image: 'https://webdeveloper.co.za/media/web-developer-2025.png',
                telephone: '+27 87 265 2465',
                email: 'support@webdeveloper.co.za',
                address: {
                  streetAddress: '123 Innovation Way',
                  addressLocality: 'Pretoria',
                  addressRegion: 'Gauteng',
                  postalCode: '0002',
                  addressCountry: 'ZA',
                },
                geo: { latitude: -25.7461, longitude: 28.1881 },
                hasMap: 'https://maps.google.com/?q=-25.7461,28.1881',
                openingHoursSpecification: [
                  { dayOfWeek: 'Monday', opens: '08:00', closes: '17:00' },
                  { dayOfWeek: 'Tuesday', opens: '08:00', closes: '17:00' },
                  { dayOfWeek: 'Wednesday', opens: '08:00', closes: '17:00' },
                  { dayOfWeek: 'Thursday', opens: '08:00', closes: '17:00' },
                  { dayOfWeek: 'Friday', opens: '08:00', closes: '16:00' },
                ],
                publicAccess: true,
                amenityFeature: [
                  { name: 'WheelchairAccessible', value: true },
                  { name: 'Parking', value: true },
                ],
                areaServed: {
                  geoMidpoint: { latitude: -25.7461, longitude: 28.1881 },
                  geoRadius: 50000,
                },
                paymentAccepted: 'Cash, Credit Card, EFT',
                currenciesAccepted: 'ZAR, USD',
                priceRange: 'R500-R2000',
              },
              persons: [
                {
                  personId: 'https://webdeveloper.co.za/#person-jane',
                  name: 'Jane Doe',
                  jobTitle: 'Support Lead',
                  telephone: '+27 87 265 2465',
                  email: 'jane.doe@webdeveloper.co.za',
                },
                {
                  personId: 'https://webdeveloper.co.za/#person-john',
                  name: 'John Smith',
                  jobTitle: 'Sales Lead',
                  telephone: '+27 87 265 2465',
                  email: 'john.smith@webdeveloper.co.za',
                },
              ],
              webPage: {
                webPageId: 'https://webdeveloper.co.za/contact/#webpage',
                url: 'https://webdeveloper.co.za/contact',
                name: 'Contact WebDeveloper',
                description: 'Get in touch with WebDeveloper for modern web solutions.',
                primaryImageOfPage: 'https://webdeveloper.co.za/media/web-developer-2025.png',
                potentialAction: [
                  {
                    actions: [
                      {
                        blockType: 'ContactAction',
                        target: {
                          urlTemplate: 'https://webdeveloper.co.za/contact',
                          actionPlatform: 'http://schema.org/DesktopWebPlatform',
                          inLanguage: 'en-ZA',
                        },
                      },
                      {
                        blockType: 'CommunicateAction',
                        name: 'Live Chat',
                        target: {
                          urlTemplate: 'https://webdeveloper.co.za/chat',
                          actionPlatform: 'http://schema.org/MobileWebPlatform',
                        },
                      },
                    ],
                  },
                ],
                inLanguage: 'en-ZA',
              },
              breadcrumb: {
                breadcrumbId: 'https://webdeveloper.co.za/contact/#breadcrumb',
                items: [
                  { position: 1, name: 'Home', item: 'https://webdeveloper.co.za/' },
                  { position: 2, name: 'Contact', item: 'https://webdeveloper.co.za/contact' },
                ],
              },
              faq: {
                faqId: 'https://webdeveloper.co.za/contact/#faq',
                mainEntity: [
                  {
                    name: 'How do I contact support?',
                    acceptedAnswer: 'Email support@webdeveloper.co.za or call +27 87 265 2465.',
                  },
                  {
                    name: 'What are your business hours?',
                    acceptedAnswer: 'We are open Monday to Friday, 08:00–17:00 (Friday until 16:00).',
                  },
                ],
              },
              website: {
                websiteId: 'https://webdeveloper.co.za/#website',
                url: 'https://webdeveloper.co.za/',
                name: 'WebDeveloper',
                sameAs: [
                  { url: 'https://twitter.com/webdeveloper' },
                  { url: 'https://www.linkedin.com/company/webdeveloper' },
                  { url: 'https://github.com/webdeveloper' },
                ],
                inLanguage: 'en-ZA',
              },
            },
          })
          console.log('✅ Seeded default Contact Details document')
        }
      } catch (e) {
        console.warn(
          '⚠️ Contact Details seed skipped or failed',
          e instanceof Error ? e.message : String(e),
        )
      }

      // Ensure Posts collection base table exists for admin list and queries
      const postsSql = `
        CREATE TABLE IF NOT EXISTS "posts" (
          "id" serial PRIMARY KEY,
          "title" varchar,
          "slug" varchar UNIQUE,
          "excerpt" text,
          "featured_image_id" integer,
          "content" jsonb,
          "post_content_draft" text,
          "author_id" integer,
          "date_published" timestamp(3) with time zone,
          "date_modified" timestamp(3) with time zone,
          "status" varchar DEFAULT 'draft',
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'posts_featured_image_id_media_id_fk'
          ) THEN
            ALTER TABLE "posts"
              ADD CONSTRAINT "posts_featured_image_id_media_id_fk"
              FOREIGN KEY ("featured_image_id") REFERENCES "media"("id")
              ON DELETE SET NULL ON UPDATE NO ACTION;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'posts_author_id_users_id_fk'
          ) THEN
            ALTER TABLE "posts"
              ADD CONSTRAINT "posts_author_id_users_id_fk"
              FOREIGN KEY ("author_id") REFERENCES "users"("id")
              ON DELETE SET NULL ON UPDATE NO ACTION;
          END IF;
        END $$;
      `
      await payload.db.pool.query(postsSql)
      console.log('✅ Ensured Posts base table exists')

      // Ensure Site global base table exists
      const siteSql = `
        CREATE TABLE IF NOT EXISTS "site" (
          "id" serial PRIMARY KEY,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );
      `
      await payload.db.pool.query(siteSql)
      console.log('✅ Ensured Site global base table exists')

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
  collections: [Users, Media, Posts, Tags, Categories, Personas, ContentPlans, ContentPlanTransactions, ContactDetails],
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
    // Disable automatic schema push in dev to avoid interactive prompts
    // Enable via env `DB_SCHEMA_PUSH=true` when intentionally migrating
    push: process.env.DB_SCHEMA_PUSH === 'true',
  }),
  // sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
