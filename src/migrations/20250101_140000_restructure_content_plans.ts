import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

// Define types for JSON structures used in migration
type ContentItemRow = {
  title: string
  slug: string
  description: string
  keywords: { keyword: string }[]
}

type LegacyContentPlanDescriptionItem = {
  content_plan_id: string
  title: string
  slug: string
  description: string
  keywords: string[]
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await payload.logger.info('Starting content plans restructure migration...')

  try {
    // First, let's add the new contentItems column as JSONB
    await payload.db.drizzle.execute(sql`
      ALTER TABLE content_plans 
      ADD COLUMN IF NOT EXISTS content_items JSONB DEFAULT '[]'::jsonb
    `)

    // Get all existing content plans with contentPlanDescription
    const existingPlansResult = await payload.db.drizzle.execute(sql`
      SELECT id, content_plan_description 
      FROM content_plans 
      WHERE content_plan_description IS NOT NULL
    `)

    const existingPlans = (existingPlansResult as any).rows || existingPlansResult

    // Migrate data from contentPlanDescription to contentItems
    for (const plan of existingPlans as any[]) {
      try {
        let contentItems: ContentItemRow[] = []
        
        if (plan.content_plan_description) {
          // Parse the existing JSON data
          const existingData = typeof plan.content_plan_description === 'string' 
            ? JSON.parse(plan.content_plan_description)
            : plan.content_plan_description

          if (Array.isArray(existingData)) {
            // Transform the data to the new structure
            contentItems = existingData.map((item: any, index: number): ContentItemRow => ({
              title: item.title || `Content Item ${index + 1}`,
              slug: item.slug || (item.title ? item.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') : `content-item-${index + 1}`),
              description: item.description || '',
              keywords: Array.isArray(item.keywords) 
                ? item.keywords.map((keyword: string) => ({ keyword: keyword.toString() }))
                : []
            }))
          }
        }

        // Update the record with the new structure
        await payload.db.drizzle.execute(sql`
          UPDATE content_plans 
          SET content_items = ${JSON.stringify(contentItems)}::jsonb
          WHERE id = ${plan.id}
        `)

        await payload.logger.info(`Migrated content plan ${plan.id} with ${contentItems.length} items`)
      } catch (error) {
        await payload.logger.error(`Error migrating content plan ${plan.id}: ${error}`)
      }
    }

    // Remove the old columns after successful migration
    await payload.db.drizzle.execute(sql`
      ALTER TABLE content_plans 
      DROP COLUMN IF EXISTS content_plan_description
    `)

    await payload.logger.info('Content plans restructure migration completed successfully')
  } catch (error) {
    await payload.logger.error(`Migration failed: ${error}`)
    throw error
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.logger.info('Rolling back content plans restructure migration...')

  try {
    // Add back the old column
    await payload.db.drizzle.execute(sql`
      ALTER TABLE content_plans 
      ADD COLUMN IF NOT EXISTS content_plan_description JSONB
    `)

    // Get all existing content plans with contentItems
    const existingPlans = await payload.db.drizzle.execute(sql`
      SELECT id, content_items 
      FROM content_plans 
      WHERE content_items IS NOT NULL
    `)

    // Migrate data back from contentItems to contentPlanDescription
    for (const plan of (existingPlans as any).rows || (existingPlans as any)) {
      try {
        let contentPlanDescription: LegacyContentPlanDescriptionItem[] = []
        
        if ((plan as any).content_items) {
          const contentItems = typeof (plan as any).content_items === 'string' 
            ? JSON.parse((plan as any).content_items)
            : (plan as any).content_items

          if (Array.isArray(contentItems)) {
            // Transform back to the old structure
            contentPlanDescription = contentItems.map((item: any, index: number): LegacyContentPlanDescriptionItem => ({
              content_plan_id: (index + 1).toString(),
              title: item.title || '',
              slug: item.slug || '',
              description: item.description || '',
              keywords: Array.isArray(item.keywords) 
                ? item.keywords.map((kw: any) => kw.keyword || kw)
                : []
            }))
          }
        }

        // Update the record with the old structure
        await payload.db.drizzle.execute(sql`
          UPDATE content_plans 
          SET content_plan_description = ${JSON.stringify(contentPlanDescription)}::jsonb
          WHERE id = ${plan.id}
        `)

        await payload.logger.info(`Rolled back content plan ${plan.id}`)
      } catch (error) {
        await payload.logger.error(`Error rolling back content plan ${plan.id}: ${error}`)
      }
    }

    // Remove the new column
    await payload.db.drizzle.execute(sql`
      ALTER TABLE content_plans 
      DROP COLUMN IF EXISTS content_items
    `)

    await payload.logger.info('Content plans restructure rollback completed')
  } catch (error) {
    await payload.logger.error(`Rollback failed: ${error}`)
    throw error
  }
}