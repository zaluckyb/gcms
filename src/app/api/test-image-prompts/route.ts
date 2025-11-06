import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(_request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // fetch a user to satisfy access control (owner relationship required)
    const users = await payload.find({ collection: 'users', limit: 1 })
    if (!users.docs.length) {
      return NextResponse.json({ success: false, error: 'No users found to act as owner' }, { status: 500 })
    }
    const ownerId = users.docs[0].id

    // create a temporary content plan with one content item including image_prompts
    const created = await payload.create({
      collection: 'contentPlans',
      data: {
        owner: ownerId,
        topic: `Temp Image Prompts Test ${new Date().toISOString()}`,
        status: 'draft',
        contentItems: [
          {
            title: 'Temp Item with image_prompts',
            slug: 'temp-item-image-prompts',
            description: 'Verifying dynamic image prompts persistence via API route',
            image_prompts: [
              { prompt: 'A misty forest at dawn with golden light' },
              { prompt: 'A retro sci-fi rover on a dusty red planet' },
            ],
          },
        ],
      },
      depth: 2,
    })

    const item = Array.isArray(created?.contentItems) ? created.contentItems[0] : null
    if (!item?.id) {
      // cleanup if something odd happened
      await payload.delete({ collection: 'contentPlans', where: { id: { equals: created.id } }, overrideAccess: true })
      return NextResponse.json({ success: false, error: 'No content item created' }, { status: 500 })
    }

    // verify child table rows using Payload DB adapter
    const db = payload.db
    const rowsRes: any = await db.drizzle.execute(`
      SELECT id, _order, prompt
      FROM content_plans_content_items_image_prompts
      WHERE _parent_id = '${item.id}'
      ORDER BY _order;
    `)

    const rows = rowsRes?.rows ?? []

    // cleanup test doc to keep DB clean
    await payload.delete({ collection: 'contentPlans', where: { id: { equals: created.id } }, overrideAccess: true })

    return NextResponse.json({
      success: true,
      createdPlanId: created.id,
      itemId: item.id,
      imagePromptsCount: rows.length,
      imagePrompts: rows,
      note: 'Temporary plan deleted after verification',
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}