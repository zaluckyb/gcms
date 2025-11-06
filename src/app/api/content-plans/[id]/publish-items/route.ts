import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

interface PublishResponse {
  success: boolean
  publishedCount: number
  skippedCount: number
  errors: string[]
  publishedPosts: Array<{
    id: number
    title: string
    slug: string
  }>
}

interface PublishRequestBody {
  selectedItems?: string[]
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function processKeywords(keywords: Array<{ keyword: string }>, payload: any, userId: number) {
  const tagIds: number[] = []
  for (const keywordObj of keywords || []) {
    const keyword = keywordObj.keyword?.toLowerCase().trim()
    if (!keyword) continue
    try {
      const existingTags = await payload.find({
        collection: 'tags',
        where: { name: { equals: keyword } },
      })
      if (existingTags.docs.length > 0) {
        tagIds.push(existingTags.docs[0].id)
      } else {
        const newTag = await payload.create({
          collection: 'tags',
          data: {
            name: keyword,
            slug: generateSlug(keyword),
            color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
          },
        })
        tagIds.push(newTag.id)
      }
    } catch (error) {
      console.error(`Error processing keyword "${keyword}":`, error)
    }
  }
  return tagIds
}

async function checkDuplicateSlug(slug: string, payload: any): Promise<boolean> {
  try {
    const existingPosts = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
    })
    return existingPosts.docs.length > 0
  } catch (error) {
    console.error('Error checking duplicate slug:', error)
    return false
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id?: string }> },
) {
  const startTime = Date.now()

  try {
    const payload = await getPayload({ config })
    const { id: paramId } = await context.params
    const url = new URL(request.url)
    const pathIdMatch = url.pathname.match(/content-plans\/([^/]+)\/publish-items/)
    const rawId = paramId ?? pathIdMatch?.[1]
    const { selectedItems }: PublishRequestBody = await request.json()

    if (!rawId) {
      console.error('Publish route missing id. url:', url.pathname, 'params:', { id: paramId })
      return NextResponse.json(
        {
          success: false,
          error: 'Missing content plan ID',
          publishedCount: 0,
          skippedCount: 0,
          errors: ['Missing route parameter id'],
          publishedPosts: [],
        },
        { status: 400 },
      )
    }

    const idNum = Number(rawId)
    const planIdArg: any = Number.isFinite(idNum) ? idNum : rawId

    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          publishedCount: 0,
          skippedCount: 0,
          errors: ['User not authenticated'],
          publishedPosts: [],
        },
        { status: 401 },
      )
    }

    let contentPlan: any
    try {
      contentPlan = await payload.findByID({
        collection: 'contentPlans',
        id: planIdArg,
        depth: 2,
      })
    } catch (e) {
      console.error('findByID failed', e)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load content plan',
          publishedCount: 0,
          skippedCount: 0,
          errors: [e instanceof Error ? e.message : 'Unknown error'],
          publishedPosts: [],
        },
        { status: 400 },
      )
    }

    if (!contentPlan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content plan not found',
          publishedCount: 0,
          skippedCount: 0,
          errors: ['Content plan not found'],
          publishedPosts: [],
        },
        { status: 404 },
      )
    }

    const isAdminOrEditor = user.role === 'admin' || user.role === 'editor'
    const ownerRaw = typeof contentPlan.owner === 'object' ? contentPlan.owner?.id : contentPlan.owner
    const toNum = (v: any) => (typeof v === 'string' ? Number(v) : v)
    const isOwner = !!ownerRaw && toNum(ownerRaw) === toNum(user.id)

    if (!isAdminOrEditor && !isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions: only the owner or admins/editors can publish',
          publishedCount: 0,
          skippedCount: 0,
          errors: ['You do not have permission to publish items from this plan'],
          publishedPosts: [],
        },
        { status: 403 },
      )
    }

    if (!contentPlan.contentItems || contentPlan.contentItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No content items to publish',
          publishedCount: 0,
          skippedCount: 0,
          errors: ['No content items found in this content plan'],
          publishedPosts: [],
        },
        { status: 400 },
      )
    }

    let itemsToPublish = contentPlan.contentItems
    if (selectedItems && selectedItems.length > 0) {
      itemsToPublish = contentPlan.contentItems.filter((item: any) => selectedItems.includes(item.id || ''))
    }

    if (itemsToPublish.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid content items selected',
          publishedCount: 0,
          skippedCount: 0,
          errors: ['No valid content items selected for publishing'],
          publishedPosts: [],
        },
        { status: 400 },
      )
    }

    const response: PublishResponse = {
      success: true,
      publishedCount: 0,
      skippedCount: 0,
      errors: [],
      publishedPosts: [],
    }

    for (const contentItem of itemsToPublish) {
      try {
        if (!contentItem.title || !contentItem.slug) {
          response.errors.push(`Content item "${contentItem.title || 'Untitled'}" is missing required fields (title/slug)`) 
          response.skippedCount++
          continue
        }

        const isDuplicate = await checkDuplicateSlug(contentItem.slug, payload)
        if (isDuplicate) {
          response.errors.push(`Post with slug "${contentItem.slug}" already exists. Skipping "${contentItem.title}"`)
          response.skippedCount++
          continue
        }

        const tagIds = await processKeywords(contentItem.keywords || [], payload, toNum(user.id) || user.id)

        // Prepare shared description text and JSON payload for dual-publishing
        const descriptionText = contentItem.description || ''
        const jsonDraftPayload = {
          content_plan_id: String(contentPlan.id ?? planIdArg),
          title: contentItem.title,
          slug: contentItem.slug,
          description: descriptionText,
          keywords: Array.isArray(contentItem.keywords)
            ? contentItem.keywords
                .map((k: any) => (typeof k === 'string' ? k : k?.keyword))
                .filter((k: any) => typeof k === 'string' && k.trim().length > 0)
            : [],
          prompt: typeof contentItem.prompt === 'string' ? contentItem.prompt : undefined,
          audience: typeof contentItem.audience === 'string' ? contentItem.audience : undefined,
          goal: typeof contentItem.goal === 'string' ? contentItem.goal : undefined,
          region: typeof contentItem.region === 'string' ? contentItem.region : undefined,
          word_count: (() => {
            const n = Number((contentItem as any)?.word_count ?? (contentItem as any)?.wordCount)
            return Number.isFinite(n) && n >= 0 ? n : undefined
          })(),
          image_prompts: Array.isArray((contentItem as any)?.image_prompts)
            ? (contentItem as any).image_prompts
                .map((p: any) => (typeof p === 'string' ? p : (typeof p?.prompt === 'string' ? p.prompt : '')))
                .filter((p: string) => p.trim().length > 0)
            : [],
        }
        const draftJsonString = JSON.stringify(jsonDraftPayload, null, 2)

        const draftPost = await payload.create({
          collection: 'posts',
          data: {
            title: contentItem.title,
            slug: contentItem.slug,
            // Maintain existing behavior: publish to Description (excerpt)
            excerpt: descriptionText,
            // New: synchronously copy JSON of the content plan item
            postContentDraft: draftJsonString,
            content: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        text: descriptionText || 'Content coming soon...',
                        version: 1,
                      },
                    ],
                    format: '',
                    indent: 0,
                    version: 1,
                  },
                ],
                direction: null,
                format: '',
                indent: 0,
                version: 1,
              },
            },
            status: 'draft',
            author: toNum(user.id) || user.id,
            tags: tagIds,
            plannedPublishDate: contentPlan.startDate || null,
            datePublished: null,
            dateModified: new Date().toISOString(),
          },
        })

        // Validation: confirm fields received expected content
        try {
          const excerptMatches = (draftPost.excerpt ?? '') === descriptionText
          const draftMatches = (draftPost.postContentDraft ?? '') === draftJsonString

          if (!excerptMatches || !draftMatches) {
            console.warn(
              `⚠️ Validation mismatch for post ${draftPost.id}. ` +
              `excerptMatches=${excerptMatches}, draftMatches=${draftMatches}. Attempting corrective update...`
            )

            const corrected = await payload.update({
              collection: 'posts',
              id: draftPost.id,
              data: {
                excerpt: descriptionText,
                postContentDraft: draftJsonString,
              },
            })

            const correctedExcerptMatches = (corrected.excerpt ?? '') === descriptionText
            const correctedDraftMatches = (corrected.postContentDraft ?? '') === draftJsonString

            if (!correctedExcerptMatches || !correctedDraftMatches) {
              const vErr = `Post ${draftPost.id} failed dual-publish validation after correction: ` +
                `excerpt=${String(corrected.excerpt ?? '')?.length}, draft=${String(corrected.postContentDraft ?? '')?.length}`
              console.error(`❌ ${vErr}`)
              response.errors.push(vErr)
            }
          }
        } catch (validationError) {
          const msg = `Validation/update error for post ${draftPost.id}: ` +
            (validationError instanceof Error ? validationError.message : 'Unknown error')
          console.error(`❌ ${msg}`)
          response.errors.push(msg)
        }

        response.publishedCount++
        response.publishedPosts.push({ id: draftPost.id, title: draftPost.title, slug: draftPost.slug })
        console.log(`✅ Successfully created draft post: "${contentItem.title}" (ID: ${draftPost.id})`)
      } catch (itemError) {
        const errorMessage = `Failed to publish "${contentItem.title}": ${itemError instanceof Error ? itemError.message : 'Unknown error'}`
        console.error(`❌ ${errorMessage}`)
        response.errors.push(errorMessage)
        response.skippedCount++
      }
    }

    const executionTime = Date.now() - startTime
    console.log(`📊 Publishing complete: ${response.publishedCount} posts created, ${response.skippedCount} skipped in ${executionTime}ms`)
    if (response.errors.length > 0) {
      console.log(`⚠️  Errors encountered: ${response.errors.join('; ')}`)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Publishing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        publishedCount: 0,
        skippedCount: 0,
        errors: [error instanceof Error ? error.message : 'An unexpected error occurred'],
        publishedPosts: [],
      },
      { status: 500 },
    )
  }
}