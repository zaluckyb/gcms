import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'user');
  CREATE TYPE "public"."enum_content_plans_status" AS ENUM('draft', 'active', 'completed', 'archived');
  CREATE TYPE "public"."enum_content_plan_transactions_operation" AS ENUM('save_generated', 'update', 'delete');
  CREATE TYPE "public"."enum_content_plan_transactions_status" AS ENUM('pending', 'in_progress', 'committed', 'failed', 'rolled_back');
  CREATE TYPE "public"."enum_site_open_graph_defaults_og_type" AS ENUM('website', 'article');
  CREATE TYPE "public"."enum_site_twitter_defaults_twitter_card" AS ENUM('summary_large_image', 'summary');
  CREATE TYPE "public"."enum_site_schema_defaults_default_schema_type" AS ENUM('Article', 'BlogPosting', 'NewsArticle');
  ALTER TYPE "public"."enum_posts_status" ADD VALUE 'archived';
  CREATE TABLE "users_persona_profile_strengths" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "users_persona_profile_uses" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer,
  	"categories_id" integer
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"color" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"color" varchar,
  	"parent_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "personas_strengths" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "personas_uses" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "personas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"category" varchar,
  	"focus" varchar,
  	"personality_tone" varchar,
  	"personality_voice_style" varchar,
  	"personality_motivations" varchar,
  	"personality_audience_perception" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "content_plans_content_items_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"keyword" varchar NOT NULL
  );
  
  CREATE TABLE "content_plans_content_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "content_plans" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"owner_id" integer NOT NULL,
  	"status" "enum_content_plans_status" DEFAULT 'draft',
  	"topic" varchar NOT NULL,
  	"description" varchar,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "content_plan_transactions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"transaction_id" varchar NOT NULL,
  	"content_plan_id" numeric NOT NULL,
  	"operation" "enum_content_plan_transactions_operation" DEFAULT 'save_generated' NOT NULL,
  	"status" "enum_content_plan_transactions_status" DEFAULT 'pending' NOT NULL,
  	"error_details" varchar,
  	"metadata" jsonb,
  	"retry_count" numeric DEFAULT 0,
  	"execution_time_ms" numeric,
  	"completed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_schema_defaults_organization_same_as" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar
  );
  
  CREATE TABLE "site_preconnect" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar
  );
  
  CREATE TABLE "site_dns_prefetch" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar
  );
  
  CREATE TABLE "site" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar DEFAULT 'Web Developer' NOT NULL,
  	"site_url" varchar DEFAULT 'https://webdeveloper.org.za/' NOT NULL,
  	"site_description" varchar DEFAULT 'Professional web development services in South Africa',
  	"site_tagline" varchar,
  	"seo_defaults_meta_author" varchar DEFAULT 'Web Developer',
  	"seo_defaults_robots" varchar DEFAULT 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
  	"seo_defaults_charset" varchar DEFAULT 'UTF-8',
  	"seo_defaults_viewport" varchar DEFAULT 'width=device-width, initial-scale=1',
  	"seo_defaults_theme_color" varchar DEFAULT '#000000',
  	"seo_defaults_language" varchar DEFAULT 'en-ZA',
  	"seo_defaults_revisit_after" varchar DEFAULT '7 days',
  	"open_graph_defaults_og_site_name" varchar DEFAULT 'Web Developer',
  	"open_graph_defaults_og_locale" varchar DEFAULT 'en_ZA',
  	"open_graph_defaults_og_type" "enum_site_open_graph_defaults_og_type" DEFAULT 'article',
  	"open_graph_defaults_default_og_image_id" integer,
  	"open_graph_defaults_default_og_image_alt" varchar,
  	"twitter_defaults_twitter_card" "enum_site_twitter_defaults_twitter_card" DEFAULT 'summary_large_image',
  	"twitter_defaults_twitter_site" varchar DEFAULT '@webdeveloper',
  	"twitter_defaults_twitter_creator" varchar DEFAULT '@webdeveloper',
  	"schema_defaults_generate_j_s_o_n_l_d" boolean DEFAULT true,
  	"schema_defaults_default_schema_type" "enum_site_schema_defaults_default_schema_type" DEFAULT 'Article',
  	"schema_defaults_in_language" varchar DEFAULT 'en-ZA',
  	"schema_defaults_is_accessible_for_free" boolean DEFAULT true,
  	"schema_defaults_organization_name" varchar DEFAULT 'Web Developer',
  	"schema_defaults_organization_url" varchar DEFAULT 'https://webdeveloper.org.za/',
  	"schema_defaults_organization_logo_id" integer,
  	"schema_defaults_publisher_name" varchar DEFAULT 'Web Developer',
  	"schema_defaults_publisher_logo_id" integer,
  	"schema_defaults_web_site_url" varchar DEFAULT 'https://webdeveloper.org.za/',
  	"schema_defaults_web_site_name" varchar DEFAULT 'Web Developer',
  	"schema_defaults_web_site_search_action_target" varchar DEFAULT 'https://webdeveloper.org.za/search?q={search_term_string}',
  	"schema_defaults_web_site_search_action_query_input" varchar DEFAULT 'required name=search_term_string',
  	"favicon_i_c_o_id" integer,
  	"icon_s_v_g_id" integer,
  	"apple_touch_icon_id" integer,
  	"web_app_manifest_id" integer,
  	"cdn_domain" varchar,
  	"analytics_or_ads_domain" varchar,
  	"rss_link" varchar DEFAULT '/rss.xml',
  	"google_site_verification" varchar,
  	"bing_ms_validate" varchar,
  	"yandex_verification" varchar,
  	"gtm_i_d" varchar,
  	"ga_measurement_i_d" varchar,
  	"facebook_pixel_i_d" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "posts_open_graph_article_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_jsonld_schema_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_jsonld_schema_author_same_as" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_jsonld_breadcrumbs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_jsonld_organization_same_as" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_hreflang" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_preconnect" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_dns_prefetch" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_preload_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v_version_open_graph_article_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v_version_jsonld_schema_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v_version_jsonld_schema_author_same_as" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v_version_jsonld_breadcrumbs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v_version_jsonld_organization_same_as" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v_version_hreflang" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v_version_preconnect" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v_version_dns_prefetch" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v_version_preload_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "posts_open_graph_article_tags" CASCADE;
  DROP TABLE "posts_jsonld_schema_images" CASCADE;
  DROP TABLE "posts_jsonld_schema_author_same_as" CASCADE;
  DROP TABLE "posts_jsonld_breadcrumbs" CASCADE;
  DROP TABLE "posts_jsonld_organization_same_as" CASCADE;
  DROP TABLE "posts_hreflang" CASCADE;
  DROP TABLE "posts_preconnect" CASCADE;
  DROP TABLE "posts_dns_prefetch" CASCADE;
  DROP TABLE "posts_preload_images" CASCADE;
  DROP TABLE "_posts_v_version_open_graph_article_tags" CASCADE;
  DROP TABLE "_posts_v_version_jsonld_schema_images" CASCADE;
  DROP TABLE "_posts_v_version_jsonld_schema_author_same_as" CASCADE;
  DROP TABLE "_posts_v_version_jsonld_breadcrumbs" CASCADE;
  DROP TABLE "_posts_v_version_jsonld_organization_same_as" CASCADE;
  DROP TABLE "_posts_v_version_hreflang" CASCADE;
  DROP TABLE "_posts_v_version_preconnect" CASCADE;
  DROP TABLE "_posts_v_version_dns_prefetch" CASCADE;
  DROP TABLE "_posts_v_version_preload_images" CASCADE;
  DROP TABLE "_posts_v" CASCADE;
  ALTER TABLE "posts" DROP CONSTRAINT "posts_jsonld_schema_publisher_logo_id_media_id_fk";
  
  ALTER TABLE "posts" DROP CONSTRAINT "posts_jsonld_organization_logo_id_media_id_fk";
  
  ALTER TABLE "posts" DROP CONSTRAINT "posts_favicon_i_c_o_id_media_id_fk";
  
  ALTER TABLE "posts" DROP CONSTRAINT "posts_icon_s_v_g_id_media_id_fk";
  
  ALTER TABLE "posts" DROP CONSTRAINT "posts_apple_touch_icon_id_media_id_fk";
  
  ALTER TABLE "posts" DROP CONSTRAINT "posts_web_app_manifest_id_media_id_fk";
  
  DROP INDEX "posts_jsonld_schema_publisher_jsonld_schema_publisher_lo_idx";
  DROP INDEX "posts_jsonld_organization_jsonld_organization_logo_idx";
  DROP INDEX "posts_favicon_i_c_o_idx";
  DROP INDEX "posts_icon_s_v_g_idx";
  DROP INDEX "posts_apple_touch_icon_idx";
  DROP INDEX "posts_web_app_manifest_idx";
  DROP INDEX "posts__status_idx";
  ALTER TABLE "posts" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "posts" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "posts" ALTER COLUMN "content" SET NOT NULL;
  ALTER TABLE "posts" ALTER COLUMN "status" SET NOT NULL;
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'user' NOT NULL;
  ALTER TABLE "users" ADD COLUMN "persona_selected_persona_id" integer;
  ALTER TABLE "users" ADD COLUMN "persona_profile_name" varchar;
  ALTER TABLE "users" ADD COLUMN "persona_profile_category" varchar;
  ALTER TABLE "users" ADD COLUMN "persona_profile_focus" varchar;
  ALTER TABLE "users" ADD COLUMN "persona_profile_personality_tone" varchar;
  ALTER TABLE "users" ADD COLUMN "persona_profile_personality_voice_style" varchar;
  ALTER TABLE "users" ADD COLUMN "persona_profile_personality_motivations" varchar;
  ALTER TABLE "users" ADD COLUMN "persona_profile_personality_audience_perception" varchar;
  ALTER TABLE "posts" ADD COLUMN "author_id" integer;
  ALTER TABLE "posts" ADD COLUMN "planned_publish_date" timestamp(3) with time zone;
  ALTER TABLE "posts" ADD COLUMN "metadata_reading_time" numeric;
  ALTER TABLE "posts" ADD COLUMN "metadata_word_count" numeric;
  ALTER TABLE "posts" ADD COLUMN "metadata_last_modified" timestamp(3) with time zone;
  ALTER TABLE "posts" ADD COLUMN "seo_computed" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "personas_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "content_plans_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "content_plan_transactions_id" integer;
  ALTER TABLE "users_persona_profile_strengths" ADD CONSTRAINT "users_persona_profile_strengths_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_persona_profile_uses" ADD CONSTRAINT "users_persona_profile_uses_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_1_idx" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "personas_strengths" ADD CONSTRAINT "personas_strengths_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."personas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "personas_uses" ADD CONSTRAINT "personas_uses_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."personas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "content_plans_content_items_keywords" ADD CONSTRAINT "content_plans_content_items_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."content_plans_content_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "content_plans_content_items" ADD CONSTRAINT "content_plans_content_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."content_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "content_plans" ADD CONSTRAINT "content_plans_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_schema_defaults_organization_same_as" ADD CONSTRAINT "site_schema_defaults_organization_same_as_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_preconnect" ADD CONSTRAINT "site_preconnect_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_dns_prefetch" ADD CONSTRAINT "site_dns_prefetch_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site" ADD CONSTRAINT "site_open_graph_defaults_default_og_image_id_media_id_fk" FOREIGN KEY ("open_graph_defaults_default_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site" ADD CONSTRAINT "site_schema_defaults_organization_logo_id_media_id_fk" FOREIGN KEY ("schema_defaults_organization_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site" ADD CONSTRAINT "site_schema_defaults_publisher_logo_id_media_id_fk" FOREIGN KEY ("schema_defaults_publisher_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site" ADD CONSTRAINT "site_favicon_i_c_o_id_media_id_fk" FOREIGN KEY ("favicon_i_c_o_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site" ADD CONSTRAINT "site_icon_s_v_g_id_media_id_fk" FOREIGN KEY ("icon_s_v_g_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site" ADD CONSTRAINT "site_apple_touch_icon_id_media_id_fk" FOREIGN KEY ("apple_touch_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site" ADD CONSTRAINT "site_web_app_manifest_id_media_id_fk" FOREIGN KEY ("web_app_manifest_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_persona_profile_strengths_order_idx" ON "users_persona_profile_strengths" USING btree ("_order");
  CREATE INDEX "users_persona_profile_strengths_parent_id_idx" ON "users_persona_profile_strengths" USING btree ("_parent_id");
  CREATE INDEX "users_persona_profile_uses_order_idx" ON "users_persona_profile_uses" USING btree ("_order");
  CREATE INDEX "users_persona_profile_uses_parent_id_idx" ON "users_persona_profile_uses" USING btree ("_parent_id");
  CREATE INDEX "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX "posts_rels_tags_id_idx" ON "posts_rels" USING btree ("tags_id");
  CREATE INDEX "posts_rels_categories_id_idx" ON "posts_rels" USING btree ("categories_id");
  CREATE UNIQUE INDEX "tags_name_idx" ON "tags" USING btree ("name");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_name_idx" ON "categories" USING btree ("name");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "personas_strengths_order_idx" ON "personas_strengths" USING btree ("_order");
  CREATE INDEX "personas_strengths_parent_id_idx" ON "personas_strengths" USING btree ("_parent_id");
  CREATE INDEX "personas_uses_order_idx" ON "personas_uses" USING btree ("_order");
  CREATE INDEX "personas_uses_parent_id_idx" ON "personas_uses" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "personas_name_idx" ON "personas" USING btree ("name");
  CREATE INDEX "personas_updated_at_idx" ON "personas" USING btree ("updated_at");
  CREATE INDEX "personas_created_at_idx" ON "personas" USING btree ("created_at");
  CREATE INDEX "content_plans_content_items_keywords_order_idx" ON "content_plans_content_items_keywords" USING btree ("_order");
  CREATE INDEX "content_plans_content_items_keywords_parent_id_idx" ON "content_plans_content_items_keywords" USING btree ("_parent_id");
  CREATE INDEX "content_plans_content_items_order_idx" ON "content_plans_content_items" USING btree ("_order");
  CREATE INDEX "content_plans_content_items_parent_id_idx" ON "content_plans_content_items" USING btree ("_parent_id");
  CREATE INDEX "content_plans_content_items_slug_idx" ON "content_plans_content_items" USING btree ("slug");
  CREATE INDEX "content_plans_owner_idx" ON "content_plans" USING btree ("owner_id");
  CREATE INDEX "content_plans_status_idx" ON "content_plans" USING btree ("status");
  CREATE INDEX "content_plans_start_date_idx" ON "content_plans" USING btree ("start_date");
  CREATE INDEX "content_plans_end_date_idx" ON "content_plans" USING btree ("end_date");
  CREATE INDEX "content_plans_updated_at_idx" ON "content_plans" USING btree ("updated_at");
  CREATE INDEX "content_plans_created_at_idx" ON "content_plans" USING btree ("created_at");
  CREATE UNIQUE INDEX "content_plan_transactions_transaction_id_idx" ON "content_plan_transactions" USING btree ("transaction_id");
  CREATE INDEX "content_plan_transactions_content_plan_id_idx" ON "content_plan_transactions" USING btree ("content_plan_id");
  CREATE INDEX "content_plan_transactions_status_idx" ON "content_plan_transactions" USING btree ("status");
  CREATE INDEX "content_plan_transactions_updated_at_idx" ON "content_plan_transactions" USING btree ("updated_at");
  CREATE INDEX "content_plan_transactions_created_at_idx" ON "content_plan_transactions" USING btree ("created_at");
  CREATE INDEX "site_schema_defaults_organization_same_as_order_idx" ON "site_schema_defaults_organization_same_as" USING btree ("_order");
  CREATE INDEX "site_schema_defaults_organization_same_as_parent_id_idx" ON "site_schema_defaults_organization_same_as" USING btree ("_parent_id");
  CREATE INDEX "site_preconnect_order_idx" ON "site_preconnect" USING btree ("_order");
  CREATE INDEX "site_preconnect_parent_id_idx" ON "site_preconnect" USING btree ("_parent_id");
  CREATE INDEX "site_dns_prefetch_order_idx" ON "site_dns_prefetch" USING btree ("_order");
  CREATE INDEX "site_dns_prefetch_parent_id_idx" ON "site_dns_prefetch" USING btree ("_parent_id");
  CREATE INDEX "site_open_graph_defaults_open_graph_defaults_default_og__idx" ON "site" USING btree ("open_graph_defaults_default_og_image_id");
  CREATE INDEX "site_schema_defaults_organization_schema_defaults_organi_idx" ON "site" USING btree ("schema_defaults_organization_logo_id");
  CREATE INDEX "site_schema_defaults_publisher_schema_defaults_publisher_idx" ON "site" USING btree ("schema_defaults_publisher_logo_id");
  CREATE INDEX "site_favicon_i_c_o_idx" ON "site" USING btree ("favicon_i_c_o_id");
  CREATE INDEX "site_icon_s_v_g_idx" ON "site" USING btree ("icon_s_v_g_id");
  CREATE INDEX "site_apple_touch_icon_idx" ON "site" USING btree ("apple_touch_icon_id");
  CREATE INDEX "site_web_app_manifest_idx" ON "site" USING btree ("web_app_manifest_id");
  ALTER TABLE "users" ADD CONSTRAINT "users_persona_selected_persona_id_personas_id_fk" FOREIGN KEY ("persona_selected_persona_id") REFERENCES "public"."personas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_personas_fk" FOREIGN KEY ("personas_id") REFERENCES "public"."personas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_content_plans_fk" FOREIGN KEY ("content_plans_id") REFERENCES "public"."content_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_content_plan_transactions_fk" FOREIGN KEY ("content_plan_transactions_id") REFERENCES "public"."content_plan_transactions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_persona_persona_selected_persona_idx" ON "users" USING btree ("persona_selected_persona_id");
  CREATE INDEX "posts_author_idx" ON "posts" USING btree ("author_id");
  CREATE INDEX "posts_date_published_idx" ON "posts" USING btree ("date_published");
  CREATE INDEX "posts_planned_publish_date_idx" ON "posts" USING btree ("planned_publish_date");
  CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_personas_id_idx" ON "payload_locked_documents_rels" USING btree ("personas_id");
  CREATE INDEX "payload_locked_documents_rels_content_plans_id_idx" ON "payload_locked_documents_rels" USING btree ("content_plans_id");
  CREATE INDEX "payload_locked_documents_rels_content_plan_transactions__idx" ON "payload_locked_documents_rels" USING btree ("content_plan_transactions_id");
  ALTER TABLE "posts" DROP COLUMN "seo_meta_author";
  ALTER TABLE "posts" DROP COLUMN "seo_robots";
  ALTER TABLE "posts" DROP COLUMN "seo_charset";
  ALTER TABLE "posts" DROP COLUMN "seo_viewport";
  ALTER TABLE "posts" DROP COLUMN "seo_theme_color";
  ALTER TABLE "posts" DROP COLUMN "seo_language";
  ALTER TABLE "posts" DROP COLUMN "seo_revisit_after";
  ALTER TABLE "posts" DROP COLUMN "open_graph_og_type";
  ALTER TABLE "posts" DROP COLUMN "open_graph_og_u_r_l";
  ALTER TABLE "posts" DROP COLUMN "open_graph_og_image_alt";
  ALTER TABLE "posts" DROP COLUMN "open_graph_og_site_name";
  ALTER TABLE "posts" DROP COLUMN "open_graph_og_locale";
  ALTER TABLE "posts" DROP COLUMN "open_graph_article_author";
  ALTER TABLE "posts" DROP COLUMN "open_graph_article_published_time";
  ALTER TABLE "posts" DROP COLUMN "open_graph_article_modified_time";
  ALTER TABLE "posts" DROP COLUMN "open_graph_article_section";
  ALTER TABLE "posts" DROP COLUMN "twitter_twitter_card";
  ALTER TABLE "posts" DROP COLUMN "twitter_twitter_image_alt";
  ALTER TABLE "posts" DROP COLUMN "twitter_twitter_site";
  ALTER TABLE "posts" DROP COLUMN "twitter_twitter_creator";
  ALTER TABLE "posts" DROP COLUMN "jsonld_generate_j_s_o_n_l_d";
  ALTER TABLE "posts" DROP COLUMN "jsonld_schema_type";
  ALTER TABLE "posts" DROP COLUMN "jsonld_schema_article_section";
  ALTER TABLE "posts" DROP COLUMN "jsonld_schema_keywords";
  ALTER TABLE "posts" DROP COLUMN "jsonld_in_language";
  ALTER TABLE "posts" DROP COLUMN "jsonld_is_accessible_for_free";
  ALTER TABLE "posts" DROP COLUMN "jsonld_schema_author_name";
  ALTER TABLE "posts" DROP COLUMN "jsonld_schema_author_url";
  ALTER TABLE "posts" DROP COLUMN "jsonld_schema_publisher_name";
  ALTER TABLE "posts" DROP COLUMN "jsonld_schema_publisher_logo_id";
  ALTER TABLE "posts" DROP COLUMN "jsonld_schema_u_r_l";
  ALTER TABLE "posts" DROP COLUMN "jsonld_main_entity_of_page";
  ALTER TABLE "posts" DROP COLUMN "jsonld_organization_name";
  ALTER TABLE "posts" DROP COLUMN "jsonld_organization_url";
  ALTER TABLE "posts" DROP COLUMN "jsonld_organization_logo_id";
  ALTER TABLE "posts" DROP COLUMN "jsonld_web_site_url";
  ALTER TABLE "posts" DROP COLUMN "jsonld_web_site_name";
  ALTER TABLE "posts" DROP COLUMN "jsonld_web_site_search_action_target";
  ALTER TABLE "posts" DROP COLUMN "jsonld_web_site_search_action_query_input";
  ALTER TABLE "posts" DROP COLUMN "jsonld_web_page_url";
  ALTER TABLE "posts" DROP COLUMN "jsonld_web_page_name";
  ALTER TABLE "posts" DROP COLUMN "jsonld_web_page_in_language";
  ALTER TABLE "posts" DROP COLUMN "jsonld_web_page_description";
  ALTER TABLE "posts" DROP COLUMN "favicon_i_c_o_id";
  ALTER TABLE "posts" DROP COLUMN "icon_s_v_g_id";
  ALTER TABLE "posts" DROP COLUMN "apple_touch_icon_id";
  ALTER TABLE "posts" DROP COLUMN "web_app_manifest_id";
  ALTER TABLE "posts" DROP COLUMN "cdn_domain";
  ALTER TABLE "posts" DROP COLUMN "analytics_or_ads_domain";
  ALTER TABLE "posts" DROP COLUMN "rss_link";
  ALTER TABLE "posts" DROP COLUMN "amphtml_link";
  ALTER TABLE "posts" DROP COLUMN "google_site_verification";
  ALTER TABLE "posts" DROP COLUMN "bing_ms_validate";
  ALTER TABLE "posts" DROP COLUMN "yandex_verification";
  ALTER TABLE "posts" DROP COLUMN "prev_u_r_l";
  ALTER TABLE "posts" DROP COLUMN "next_u_r_l";
  ALTER TABLE "posts" DROP COLUMN "gtm_i_d";
  ALTER TABLE "posts" DROP COLUMN "ga_measurement_i_d";
  ALTER TABLE "posts" DROP COLUMN "facebook_pixel_i_d";
  ALTER TABLE "posts" DROP COLUMN "_status";
  DROP TYPE "public"."enum_posts_open_graph_og_type";
  DROP TYPE "public"."enum_posts_twitter_twitter_card";
  DROP TYPE "public"."enum_posts_jsonld_schema_type";
  DROP TYPE "public"."enum__posts_v_version_status";
  DROP TYPE "public"."enum__posts_v_version_open_graph_og_type";
  DROP TYPE "public"."enum__posts_v_version_twitter_twitter_card";
  DROP TYPE "public"."enum__posts_v_version_jsonld_schema_type";`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_posts_open_graph_og_type" AS ENUM('article', 'website', 'profile', 'video.other');
  CREATE TYPE "public"."enum_posts_twitter_twitter_card" AS ENUM('summary_large_image', 'summary');
  CREATE TYPE "public"."enum_posts_jsonld_schema_type" AS ENUM('Article', 'BlogPosting', 'NewsArticle');
  CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_v_version_open_graph_og_type" AS ENUM('article', 'website', 'profile', 'video.other');
  CREATE TYPE "public"."enum__posts_v_version_twitter_twitter_card" AS ENUM('summary_large_image', 'summary');
  CREATE TYPE "public"."enum__posts_v_version_jsonld_schema_type" AS ENUM('Article', 'BlogPosting', 'NewsArticle');
  CREATE TABLE "posts_open_graph_article_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "posts_jsonld_schema_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"alt" varchar
  );
  
  CREATE TABLE "posts_jsonld_schema_author_same_as" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar
  );
  
  CREATE TABLE "posts_jsonld_breadcrumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"position" numeric,
  	"name" varchar,
  	"item" varchar
  );
  
  CREATE TABLE "posts_jsonld_organization_same_as" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar
  );
  
  CREATE TABLE "posts_hreflang" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"locale" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "posts_preconnect" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar
  );
  
  CREATE TABLE "posts_dns_prefetch" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar
  );
  
  CREATE TABLE "posts_preload_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"imagesrcset" varchar,
  	"imagesizes" varchar,
  	"as" varchar DEFAULT 'image'
  );
  
  CREATE TABLE "_posts_v_version_open_graph_article_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v_version_jsonld_schema_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"alt" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v_version_jsonld_schema_author_same_as" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v_version_jsonld_breadcrumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"position" numeric,
  	"name" varchar,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v_version_jsonld_organization_same_as" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v_version_hreflang" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"locale" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v_version_preconnect" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v_version_dns_prefetch" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v_version_preload_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"imagesrcset" varchar,
  	"imagesizes" varchar,
  	"as" varchar DEFAULT 'image',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_excerpt" varchar,
  	"version_featured_image_id" integer,
  	"version_content" jsonb,
  	"version_date_published" timestamp(3) with time zone,
  	"version_date_modified" timestamp(3) with time zone,
  	"version_status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"version_seo_page_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_meta_keywords" varchar,
  	"version_seo_meta_author" varchar,
  	"version_seo_robots" varchar DEFAULT 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
  	"version_seo_canonical_u_r_l" varchar,
  	"version_seo_charset" varchar DEFAULT 'UTF-8',
  	"version_seo_viewport" varchar DEFAULT 'width=device-width, initial-scale=1',
  	"version_seo_theme_color" varchar DEFAULT '#000000',
  	"version_seo_language" varchar DEFAULT 'en-ZA',
  	"version_seo_revisit_after" varchar DEFAULT '7 days',
  	"version_open_graph_og_title" varchar,
  	"version_open_graph_og_description" varchar,
  	"version_open_graph_og_type" "enum__posts_v_version_open_graph_og_type" DEFAULT 'article',
  	"version_open_graph_og_u_r_l" varchar,
  	"version_open_graph_og_image_id" integer,
  	"version_open_graph_og_image_alt" varchar,
  	"version_open_graph_og_site_name" varchar,
  	"version_open_graph_og_locale" varchar DEFAULT 'en_ZA',
  	"version_open_graph_article_author" varchar,
  	"version_open_graph_article_published_time" timestamp(3) with time zone,
  	"version_open_graph_article_modified_time" timestamp(3) with time zone,
  	"version_open_graph_article_section" varchar,
  	"version_twitter_twitter_card" "enum__posts_v_version_twitter_twitter_card" DEFAULT 'summary_large_image',
  	"version_twitter_twitter_title" varchar,
  	"version_twitter_twitter_description" varchar,
  	"version_twitter_twitter_image_id" integer,
  	"version_twitter_twitter_image_alt" varchar,
  	"version_twitter_twitter_site" varchar,
  	"version_twitter_twitter_creator" varchar,
  	"version_jsonld_generate_j_s_o_n_l_d" boolean DEFAULT true,
  	"version_jsonld_schema_type" "enum__posts_v_version_jsonld_schema_type" DEFAULT 'Article',
  	"version_jsonld_headline" varchar,
  	"version_jsonld_schema_description" varchar,
  	"version_jsonld_schema_article_section" varchar,
  	"version_jsonld_schema_keywords" varchar,
  	"version_jsonld_in_language" varchar DEFAULT 'en-ZA',
  	"version_jsonld_is_accessible_for_free" boolean DEFAULT true,
  	"version_jsonld_schema_author_name" varchar,
  	"version_jsonld_schema_author_url" varchar,
  	"version_jsonld_schema_publisher_name" varchar,
  	"version_jsonld_schema_publisher_logo_id" integer,
  	"version_jsonld_word_count" numeric,
  	"version_jsonld_schema_u_r_l" varchar,
  	"version_jsonld_main_entity_of_page" varchar,
  	"version_jsonld_organization_name" varchar,
  	"version_jsonld_organization_url" varchar,
  	"version_jsonld_organization_logo_id" integer,
  	"version_jsonld_web_site_url" varchar,
  	"version_jsonld_web_site_name" varchar,
  	"version_jsonld_web_site_search_action_target" varchar,
  	"version_jsonld_web_site_search_action_query_input" varchar DEFAULT 'required name=search_term_string',
  	"version_jsonld_web_page_url" varchar,
  	"version_jsonld_web_page_name" varchar,
  	"version_jsonld_web_page_in_language" varchar DEFAULT 'en-ZA',
  	"version_jsonld_web_page_description" varchar,
  	"version_favicon_i_c_o_id" integer,
  	"version_icon_s_v_g_id" integer,
  	"version_apple_touch_icon_id" integer,
  	"version_web_app_manifest_id" integer,
  	"version_cdn_domain" varchar,
  	"version_analytics_or_ads_domain" varchar,
  	"version_rss_link" varchar,
  	"version_amphtml_link" varchar,
  	"version_google_site_verification" varchar,
  	"version_bing_ms_validate" varchar,
  	"version_yandex_verification" varchar,
  	"version_prev_u_r_l" varchar,
  	"version_next_u_r_l" varchar,
  	"version_gtm_i_d" varchar,
  	"version_ga_measurement_i_d" varchar,
  	"version_facebook_pixel_i_d" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "users_persona_profile_strengths" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "users_persona_profile_uses" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "personas_strengths" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "personas_uses" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "personas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "content_plans_content_items_keywords" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "content_plans_content_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "content_plans" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "content_plan_transactions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_schema_defaults_organization_same_as" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_preconnect" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_dns_prefetch" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_persona_profile_strengths" CASCADE;
  DROP TABLE "users_persona_profile_uses" CASCADE;
  DROP TABLE "posts_rels" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "personas_strengths" CASCADE;
  DROP TABLE "personas_uses" CASCADE;
  DROP TABLE "personas" CASCADE;
  DROP TABLE "content_plans_content_items_keywords" CASCADE;
  DROP TABLE "content_plans_content_items" CASCADE;
  DROP TABLE "content_plans" CASCADE;
  DROP TABLE "content_plan_transactions" CASCADE;
  DROP TABLE "site_schema_defaults_organization_same_as" CASCADE;
  DROP TABLE "site_preconnect" CASCADE;
  DROP TABLE "site_dns_prefetch" CASCADE;
  DROP TABLE "site" CASCADE;
  ALTER TABLE "users" DROP CONSTRAINT "users_persona_selected_persona_id_personas_id_fk";
  
  ALTER TABLE "posts" DROP CONSTRAINT "posts_author_id_users_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tags_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_personas_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_content_plans_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_content_plan_transactions_fk";
  
  ALTER TABLE "posts" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "posts" ALTER COLUMN "status" SET DEFAULT 'draft'::text;
  ALTER TABLE "posts" ALTER COLUMN "_status" SET DATA TYPE text;
  ALTER TABLE "posts" ALTER COLUMN "_status" SET DEFAULT 'draft'::text;
  DROP TYPE "public"."enum_posts_status";
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  ALTER TABLE "posts" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."enum_posts_status";
  ALTER TABLE "posts" ALTER COLUMN "status" SET DATA TYPE "public"."enum_posts_status" USING "status"::"public"."enum_posts_status";
  ALTER TABLE "posts" ALTER COLUMN "_status" SET DEFAULT 'draft'::"public"."enum_posts_status";
  ALTER TABLE "posts" ALTER COLUMN "_status" SET DATA TYPE "public"."enum_posts_status" USING "_status"::"public"."enum_posts_status";
  DROP INDEX "users_persona_persona_selected_persona_idx";
  DROP INDEX "posts_author_idx";
  DROP INDEX "posts_date_published_idx";
  DROP INDEX "posts_planned_publish_date_idx";
  DROP INDEX "posts_status_idx";
  DROP INDEX "payload_locked_documents_rels_tags_id_idx";
  DROP INDEX "payload_locked_documents_rels_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_personas_id_idx";
  DROP INDEX "payload_locked_documents_rels_content_plans_id_idx";
  DROP INDEX "payload_locked_documents_rels_content_plan_transactions__idx";
  ALTER TABLE "posts" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "posts" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "posts" ALTER COLUMN "content" DROP NOT NULL;
  ALTER TABLE "posts" ALTER COLUMN "status" DROP NOT NULL;
  ALTER TABLE "posts" ADD COLUMN "seo_meta_author" varchar;
  ALTER TABLE "posts" ADD COLUMN "seo_robots" varchar DEFAULT 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1';
  ALTER TABLE "posts" ADD COLUMN "seo_charset" varchar DEFAULT 'UTF-8';
  ALTER TABLE "posts" ADD COLUMN "seo_viewport" varchar DEFAULT 'width=device-width, initial-scale=1';
  ALTER TABLE "posts" ADD COLUMN "seo_theme_color" varchar DEFAULT '#000000';
  ALTER TABLE "posts" ADD COLUMN "seo_language" varchar DEFAULT 'en-ZA';
  ALTER TABLE "posts" ADD COLUMN "seo_revisit_after" varchar DEFAULT '7 days';
  ALTER TABLE "posts" ADD COLUMN "open_graph_og_type" "enum_posts_open_graph_og_type" DEFAULT 'article';
  ALTER TABLE "posts" ADD COLUMN "open_graph_og_u_r_l" varchar;
  ALTER TABLE "posts" ADD COLUMN "open_graph_og_image_alt" varchar;
  ALTER TABLE "posts" ADD COLUMN "open_graph_og_site_name" varchar;
  ALTER TABLE "posts" ADD COLUMN "open_graph_og_locale" varchar DEFAULT 'en_ZA';
  ALTER TABLE "posts" ADD COLUMN "open_graph_article_author" varchar;
  ALTER TABLE "posts" ADD COLUMN "open_graph_article_published_time" timestamp(3) with time zone;
  ALTER TABLE "posts" ADD COLUMN "open_graph_article_modified_time" timestamp(3) with time zone;
  ALTER TABLE "posts" ADD COLUMN "open_graph_article_section" varchar;
  ALTER TABLE "posts" ADD COLUMN "twitter_twitter_card" "enum_posts_twitter_twitter_card" DEFAULT 'summary_large_image';
  ALTER TABLE "posts" ADD COLUMN "twitter_twitter_image_alt" varchar;
  ALTER TABLE "posts" ADD COLUMN "twitter_twitter_site" varchar;
  ALTER TABLE "posts" ADD COLUMN "twitter_twitter_creator" varchar;
  ALTER TABLE "posts" ADD COLUMN "jsonld_generate_j_s_o_n_l_d" boolean DEFAULT true;
  ALTER TABLE "posts" ADD COLUMN "jsonld_schema_type" "enum_posts_jsonld_schema_type" DEFAULT 'Article';
  ALTER TABLE "posts" ADD COLUMN "jsonld_schema_article_section" varchar;
  ALTER TABLE "posts" ADD COLUMN "jsonld_schema_keywords" varchar;
  ALTER TABLE "posts" ADD COLUMN "jsonld_in_language" varchar DEFAULT 'en-ZA';
  ALTER TABLE "posts" ADD COLUMN "jsonld_is_accessible_for_free" boolean DEFAULT true;
  ALTER TABLE "posts" ADD COLUMN "jsonld_schema_author_name" varchar;
  ALTER TABLE "posts" ADD COLUMN "jsonld_schema_author_url" varchar;
  ALTER TABLE "posts" ADD COLUMN "jsonld_schema_publisher_name" varchar;
  ALTER TABLE "posts" ADD COLUMN "jsonld_schema_publisher_logo_id" integer;
  ALTER TABLE "posts" ADD COLUMN "jsonld_schema_u_r_l" varchar;
  ALTER TABLE "posts" ADD COLUMN "jsonld_main_entity_of_page" varchar;
  ALTER TABLE "posts" ADD COLUMN "jsonld_organization_name" varchar;
  ALTER TABLE "posts" ADD COLUMN "jsonld_organization_url" varchar;
  ALTER TABLE "posts" ADD COLUMN "jsonld_organization_logo_id" integer;
  ALTER TABLE "posts" ADD COLUMN "jsonld_web_site_url" varchar;
  ALTER TABLE "posts" ADD COLUMN "jsonld_web_site_name" varchar;
  ALTER TABLE "posts" ADD COLUMN "jsonld_web_site_search_action_target" varchar;
  ALTER TABLE "posts" ADD COLUMN "jsonld_web_site_search_action_query_input" varchar DEFAULT 'required name=search_term_string';
  ALTER TABLE "posts" ADD COLUMN "jsonld_web_page_url" varchar;
  ALTER TABLE "posts" ADD COLUMN "jsonld_web_page_name" varchar;
  ALTER TABLE "posts" ADD COLUMN "jsonld_web_page_in_language" varchar DEFAULT 'en-ZA';
  ALTER TABLE "posts" ADD COLUMN "jsonld_web_page_description" varchar;
  ALTER TABLE "posts" ADD COLUMN "favicon_i_c_o_id" integer;
  ALTER TABLE "posts" ADD COLUMN "icon_s_v_g_id" integer;
  ALTER TABLE "posts" ADD COLUMN "apple_touch_icon_id" integer;
  ALTER TABLE "posts" ADD COLUMN "web_app_manifest_id" integer;
  ALTER TABLE "posts" ADD COLUMN "cdn_domain" varchar;
  ALTER TABLE "posts" ADD COLUMN "analytics_or_ads_domain" varchar;
  ALTER TABLE "posts" ADD COLUMN "rss_link" varchar;
  ALTER TABLE "posts" ADD COLUMN "amphtml_link" varchar;
  ALTER TABLE "posts" ADD COLUMN "google_site_verification" varchar;
  ALTER TABLE "posts" ADD COLUMN "bing_ms_validate" varchar;
  ALTER TABLE "posts" ADD COLUMN "yandex_verification" varchar;
  ALTER TABLE "posts" ADD COLUMN "prev_u_r_l" varchar;
  ALTER TABLE "posts" ADD COLUMN "next_u_r_l" varchar;
  ALTER TABLE "posts" ADD COLUMN "gtm_i_d" varchar;
  ALTER TABLE "posts" ADD COLUMN "ga_measurement_i_d" varchar;
  ALTER TABLE "posts" ADD COLUMN "facebook_pixel_i_d" varchar;
  ALTER TABLE "posts" ADD COLUMN "_status" "enum_posts_status" DEFAULT 'draft';
  ALTER TABLE "posts_open_graph_article_tags" ADD CONSTRAINT "posts_open_graph_article_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_jsonld_schema_images" ADD CONSTRAINT "posts_jsonld_schema_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_jsonld_schema_images" ADD CONSTRAINT "posts_jsonld_schema_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_jsonld_schema_author_same_as" ADD CONSTRAINT "posts_jsonld_schema_author_same_as_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_jsonld_breadcrumbs" ADD CONSTRAINT "posts_jsonld_breadcrumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_jsonld_organization_same_as" ADD CONSTRAINT "posts_jsonld_organization_same_as_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_hreflang" ADD CONSTRAINT "posts_hreflang_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_preconnect" ADD CONSTRAINT "posts_preconnect_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_dns_prefetch" ADD CONSTRAINT "posts_dns_prefetch_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_preload_images" ADD CONSTRAINT "posts_preload_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_open_graph_article_tags" ADD CONSTRAINT "_posts_v_version_open_graph_article_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_jsonld_schema_images" ADD CONSTRAINT "_posts_v_version_jsonld_schema_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v_version_jsonld_schema_images" ADD CONSTRAINT "_posts_v_version_jsonld_schema_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_jsonld_schema_author_same_as" ADD CONSTRAINT "_posts_v_version_jsonld_schema_author_same_as_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_jsonld_breadcrumbs" ADD CONSTRAINT "_posts_v_version_jsonld_breadcrumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_jsonld_organization_same_as" ADD CONSTRAINT "_posts_v_version_jsonld_organization_same_as_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_hreflang" ADD CONSTRAINT "_posts_v_version_hreflang_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_preconnect" ADD CONSTRAINT "_posts_v_version_preconnect_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_dns_prefetch" ADD CONSTRAINT "_posts_v_version_dns_prefetch_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_preload_images" ADD CONSTRAINT "_posts_v_version_preload_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_open_graph_og_image_id_media_id_fk" FOREIGN KEY ("version_open_graph_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_twitter_twitter_image_id_media_id_fk" FOREIGN KEY ("version_twitter_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_jsonld_schema_publisher_logo_id_media_id_fk" FOREIGN KEY ("version_jsonld_schema_publisher_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_jsonld_organization_logo_id_media_id_fk" FOREIGN KEY ("version_jsonld_organization_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_favicon_i_c_o_id_media_id_fk" FOREIGN KEY ("version_favicon_i_c_o_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_icon_s_v_g_id_media_id_fk" FOREIGN KEY ("version_icon_s_v_g_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_apple_touch_icon_id_media_id_fk" FOREIGN KEY ("version_apple_touch_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_web_app_manifest_id_media_id_fk" FOREIGN KEY ("version_web_app_manifest_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "posts_open_graph_article_tags_order_idx" ON "posts_open_graph_article_tags" USING btree ("_order");
  CREATE INDEX "posts_open_graph_article_tags_parent_id_idx" ON "posts_open_graph_article_tags" USING btree ("_parent_id");
  CREATE INDEX "posts_jsonld_schema_images_order_idx" ON "posts_jsonld_schema_images" USING btree ("_order");
  CREATE INDEX "posts_jsonld_schema_images_parent_id_idx" ON "posts_jsonld_schema_images" USING btree ("_parent_id");
  CREATE INDEX "posts_jsonld_schema_images_image_idx" ON "posts_jsonld_schema_images" USING btree ("image_id");
  CREATE INDEX "posts_jsonld_schema_author_same_as_order_idx" ON "posts_jsonld_schema_author_same_as" USING btree ("_order");
  CREATE INDEX "posts_jsonld_schema_author_same_as_parent_id_idx" ON "posts_jsonld_schema_author_same_as" USING btree ("_parent_id");
  CREATE INDEX "posts_jsonld_breadcrumbs_order_idx" ON "posts_jsonld_breadcrumbs" USING btree ("_order");
  CREATE INDEX "posts_jsonld_breadcrumbs_parent_id_idx" ON "posts_jsonld_breadcrumbs" USING btree ("_parent_id");
  CREATE INDEX "posts_jsonld_organization_same_as_order_idx" ON "posts_jsonld_organization_same_as" USING btree ("_order");
  CREATE INDEX "posts_jsonld_organization_same_as_parent_id_idx" ON "posts_jsonld_organization_same_as" USING btree ("_parent_id");
  CREATE INDEX "posts_hreflang_order_idx" ON "posts_hreflang" USING btree ("_order");
  CREATE INDEX "posts_hreflang_parent_id_idx" ON "posts_hreflang" USING btree ("_parent_id");
  CREATE INDEX "posts_preconnect_order_idx" ON "posts_preconnect" USING btree ("_order");
  CREATE INDEX "posts_preconnect_parent_id_idx" ON "posts_preconnect" USING btree ("_parent_id");
  CREATE INDEX "posts_dns_prefetch_order_idx" ON "posts_dns_prefetch" USING btree ("_order");
  CREATE INDEX "posts_dns_prefetch_parent_id_idx" ON "posts_dns_prefetch" USING btree ("_parent_id");
  CREATE INDEX "posts_preload_images_order_idx" ON "posts_preload_images" USING btree ("_order");
  CREATE INDEX "posts_preload_images_parent_id_idx" ON "posts_preload_images" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_open_graph_article_tags_order_idx" ON "_posts_v_version_open_graph_article_tags" USING btree ("_order");
  CREATE INDEX "_posts_v_version_open_graph_article_tags_parent_id_idx" ON "_posts_v_version_open_graph_article_tags" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_jsonld_schema_images_order_idx" ON "_posts_v_version_jsonld_schema_images" USING btree ("_order");
  CREATE INDEX "_posts_v_version_jsonld_schema_images_parent_id_idx" ON "_posts_v_version_jsonld_schema_images" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_jsonld_schema_images_image_idx" ON "_posts_v_version_jsonld_schema_images" USING btree ("image_id");
  CREATE INDEX "_posts_v_version_jsonld_schema_author_same_as_order_idx" ON "_posts_v_version_jsonld_schema_author_same_as" USING btree ("_order");
  CREATE INDEX "_posts_v_version_jsonld_schema_author_same_as_parent_id_idx" ON "_posts_v_version_jsonld_schema_author_same_as" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_jsonld_breadcrumbs_order_idx" ON "_posts_v_version_jsonld_breadcrumbs" USING btree ("_order");
  CREATE INDEX "_posts_v_version_jsonld_breadcrumbs_parent_id_idx" ON "_posts_v_version_jsonld_breadcrumbs" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_jsonld_organization_same_as_order_idx" ON "_posts_v_version_jsonld_organization_same_as" USING btree ("_order");
  CREATE INDEX "_posts_v_version_jsonld_organization_same_as_parent_id_idx" ON "_posts_v_version_jsonld_organization_same_as" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_hreflang_order_idx" ON "_posts_v_version_hreflang" USING btree ("_order");
  CREATE INDEX "_posts_v_version_hreflang_parent_id_idx" ON "_posts_v_version_hreflang" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_preconnect_order_idx" ON "_posts_v_version_preconnect" USING btree ("_order");
  CREATE INDEX "_posts_v_version_preconnect_parent_id_idx" ON "_posts_v_version_preconnect" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_dns_prefetch_order_idx" ON "_posts_v_version_dns_prefetch" USING btree ("_order");
  CREATE INDEX "_posts_v_version_dns_prefetch_parent_id_idx" ON "_posts_v_version_dns_prefetch" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_preload_images_order_idx" ON "_posts_v_version_preload_images" USING btree ("_order");
  CREATE INDEX "_posts_v_version_preload_images_parent_id_idx" ON "_posts_v_version_preload_images" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_featured_image_idx" ON "_posts_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_posts_v_version_open_graph_version_open_graph_og_image_idx" ON "_posts_v" USING btree ("version_open_graph_og_image_id");
  CREATE INDEX "_posts_v_version_twitter_version_twitter_twitter_image_idx" ON "_posts_v" USING btree ("version_twitter_twitter_image_id");
  CREATE INDEX "_posts_v_version_jsonld_schema_publisher_version_jsonld__idx" ON "_posts_v" USING btree ("version_jsonld_schema_publisher_logo_id");
  CREATE INDEX "_posts_v_version_jsonld_organization_version_jsonld_orga_idx" ON "_posts_v" USING btree ("version_jsonld_organization_logo_id");
  CREATE INDEX "_posts_v_version_version_favicon_i_c_o_idx" ON "_posts_v" USING btree ("version_favicon_i_c_o_id");
  CREATE INDEX "_posts_v_version_version_icon_s_v_g_idx" ON "_posts_v" USING btree ("version_icon_s_v_g_id");
  CREATE INDEX "_posts_v_version_version_apple_touch_icon_idx" ON "_posts_v" USING btree ("version_apple_touch_icon_id");
  CREATE INDEX "_posts_v_version_version_web_app_manifest_idx" ON "_posts_v" USING btree ("version_web_app_manifest_id");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  ALTER TABLE "posts" ADD CONSTRAINT "posts_jsonld_schema_publisher_logo_id_media_id_fk" FOREIGN KEY ("jsonld_schema_publisher_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_jsonld_organization_logo_id_media_id_fk" FOREIGN KEY ("jsonld_organization_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_favicon_i_c_o_id_media_id_fk" FOREIGN KEY ("favicon_i_c_o_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_icon_s_v_g_id_media_id_fk" FOREIGN KEY ("icon_s_v_g_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_apple_touch_icon_id_media_id_fk" FOREIGN KEY ("apple_touch_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_web_app_manifest_id_media_id_fk" FOREIGN KEY ("web_app_manifest_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "posts_jsonld_schema_publisher_jsonld_schema_publisher_lo_idx" ON "posts" USING btree ("jsonld_schema_publisher_logo_id");
  CREATE INDEX "posts_jsonld_organization_jsonld_organization_logo_idx" ON "posts" USING btree ("jsonld_organization_logo_id");
  CREATE INDEX "posts_favicon_i_c_o_idx" ON "posts" USING btree ("favicon_i_c_o_id");
  CREATE INDEX "posts_icon_s_v_g_idx" ON "posts" USING btree ("icon_s_v_g_id");
  CREATE INDEX "posts_apple_touch_icon_idx" ON "posts" USING btree ("apple_touch_icon_id");
  CREATE INDEX "posts_web_app_manifest_idx" ON "posts" USING btree ("web_app_manifest_id");
  CREATE INDEX "posts__status_idx" ON "posts" USING btree ("_status");
  ALTER TABLE "users" DROP COLUMN "role";
  ALTER TABLE "users" DROP COLUMN "persona_selected_persona_id";
  ALTER TABLE "users" DROP COLUMN "persona_profile_name";
  ALTER TABLE "users" DROP COLUMN "persona_profile_category";
  ALTER TABLE "users" DROP COLUMN "persona_profile_focus";
  ALTER TABLE "users" DROP COLUMN "persona_profile_personality_tone";
  ALTER TABLE "users" DROP COLUMN "persona_profile_personality_voice_style";
  ALTER TABLE "users" DROP COLUMN "persona_profile_personality_motivations";
  ALTER TABLE "users" DROP COLUMN "persona_profile_personality_audience_perception";
  ALTER TABLE "posts" DROP COLUMN "author_id";
  ALTER TABLE "posts" DROP COLUMN "planned_publish_date";
  ALTER TABLE "posts" DROP COLUMN "metadata_reading_time";
  ALTER TABLE "posts" DROP COLUMN "metadata_word_count";
  ALTER TABLE "posts" DROP COLUMN "metadata_last_modified";
  ALTER TABLE "posts" DROP COLUMN "seo_computed";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tags_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "personas_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "content_plans_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "content_plan_transactions_id";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_content_plans_status";
  DROP TYPE "public"."enum_content_plan_transactions_operation";
  DROP TYPE "public"."enum_content_plan_transactions_status";
  DROP TYPE "public"."enum_site_open_graph_defaults_og_type";
  DROP TYPE "public"."enum_site_twitter_defaults_twitter_card";
  DROP TYPE "public"."enum_site_schema_defaults_default_schema_type";`)
}
