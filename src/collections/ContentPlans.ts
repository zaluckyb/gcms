import type { CollectionConfig } from 'payload'
import type { PayloadRequest } from 'payload'

// Helper function to generate URL-friendly slugs
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

export const ContentPlans: CollectionConfig = {
  slug: 'contentPlans',
  labels: { singular: 'Content Plan', plural: 'Content Plans' },
  admin: {
    useAsTitle: 'topic',
    group: 'Content',
    description: 'Content planning and organization',
    defaultColumns: ['topic', 'status', 'startDate', 'owner'],
  },
  access: {
    read: ({ req }: { req: PayloadRequest }) => !!req.user,
    create: ({ req }: { req: PayloadRequest }) => !!req.user,
    update: ({ req }: { req: PayloadRequest }) => !!req.user,
    delete: ({ req }: { req: PayloadRequest }) => !!req.user,
  },
  timestamps: true,
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: { position: 'sidebar' }
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'Archived', value: 'archived' },
      ],
      index: true,
      admin: { position: 'sidebar' }
    },
    {
      name: 'topic',
      type: 'text',
      required: true,
      admin: {
        description: 'Main topic or theme for this content plan'
      }
    },
    {
      name: 'contentItems',
      type: 'array',
      label: 'Content Items',
      labels: {
        singular: 'Content Item',
        plural: 'Content Items'
      },
      admin: {
        description: 'Individual content pieces within this plan',
        initCollapsed: false,
        components: {
          RowLabel: '@/components/admin/ContentItemRowLabel',
        }
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          maxLength: 200,
          admin: {
            description: 'Title of the content piece (max 200 characters)'
          },
          validate: (value: any) => {
            if (Array.isArray(value)) return true
            if (!value || typeof value !== 'string' || value.trim().length === 0) {
              return 'Title is required'
            }
            if (value.length > 200) {
              return 'Title must be 200 characters or less'
            }
            return true
          }
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
          index: true,
          admin: {
            description: 'URL-friendly version of the title (auto-generated, but editable)',
            placeholder: 'Auto-generated from title'
          },
          validate: (value: any) => {
            if (Array.isArray(value)) return true
            if (!value || typeof value !== 'string' || value.trim().length === 0) {
              return 'Slug is required'
            }
            // Check if slug is URL-friendly
            const urlFriendlyRegex = /^[a-z0-9-]+$/
            if (!urlFriendlyRegex.test(value)) {
              return 'Slug must contain only lowercase letters, numbers, and hyphens'
            }
            return true
          }
        },
        {
          name: 'description',
          type: 'textarea',
          maxLength: 1000,
          admin: {
            description: 'Detailed description of the content (max 1000 characters, supports markdown)',
            placeholder: 'Enter a detailed description...'
          },
          validate: (value: any) => {
            if (Array.isArray(value)) return true
            if (value && typeof value === 'string' && value.length > 1000) {
              return 'Description must be 1000 characters or less'
            }
            return true
          }
        },
        {
          name: 'keywords',
          type: 'array',
          label: 'Keywords',
          labels: {
            singular: 'Keyword',
            plural: 'Keywords'
          },
          admin: {
            description: 'SEO keywords and tags for this content',
            initCollapsed: true
          },
          fields: [
            {
              name: 'keyword',
              type: 'text',
              required: true,
              maxLength: 50,
              admin: {
                placeholder: 'Enter keyword or tag'
              },
              validate: (value: any) => {
                if (Array.isArray(value)) return true
                if (!value || typeof value !== 'string' || value.trim().length === 0) {
                  return 'Keyword is required'
                }
                if (value.length > 50) {
                  return 'Keyword must be 50 characters or less'
                }
                return true
              }
            }
          ]
        },
        {
          name: 'prompt',
          type: 'textarea',
          admin: {
            description: 'Generation prompt to guide content creation',
            placeholder: 'Enter a detailed prompt for this content item',
          },
          validate: (value: any) => {
            if (Array.isArray(value)) return true
            if (value && typeof value !== 'string') return 'Prompt must be text'
            return true
          },
        },
        {
          name: 'audience',
          type: 'text',
          admin: {
            description: 'Intended audience for this piece',
            placeholder: 'e.g. Small business owners, developers, etc.',
          },
          validate: (value: any) => {
            if (Array.isArray(value)) return true
            if (value && typeof value !== 'string') return 'Audience must be text'
            return true
          },
        },
        {
          name: 'goal',
          type: 'textarea',
          admin: {
            description: 'Primary goal or outcome for this content',
            placeholder: 'e.g. Educate, persuade, convert, etc.',
          },
          validate: (value: any) => {
            if (Array.isArray(value)) return true
            if (value && typeof value !== 'string') return 'Goal must be text'
            return true
          },
        },
        {
          name: 'region',
          type: 'text',
          admin: {
            description: 'Target region or locale',
            placeholder: 'e.g. South Africa',
          },
          validate: (value: any) => {
            if (Array.isArray(value)) return true
            if (value && typeof value !== 'string') return 'Region must be text'
            return true
          },
        },
        {
          name: 'word_count',
          type: 'number',
          admin: {
            description: 'Target word count for the piece',
          },
          validate: (value: any) => {
            if (Array.isArray(value)) return true
            if (value === undefined || value === null || value === '') return true
            const num = Number(value)
            if (!Number.isFinite(num) || num < 0) return 'Word count must be a non-negative number'
            return true
          },
        },
        {
          name: 'image_prompts',
          type: 'array',
          label: 'Image Prompts',
          labels: { singular: 'Image Prompt', plural: 'Image Prompts' },
          admin: { description: 'One or more prompts for generating visuals', initCollapsed: true },
          fields: [
            {
              name: 'prompt',
              type: 'textarea',
              required: true,
              admin: { placeholder: 'Describe the image concept in detail' },
              validate: (value: any) => {
                if (Array.isArray(value)) return true
                if (!value || typeof value !== 'string' || value.trim().length === 0) return 'Prompt is required'
                return true
              },
            },
          ],
        },
      ]
    },
    {
      name: 'publishActions',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/PublishContentItemsButton',
        },
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Brief description of this content plan'
      }
    },
    {
      name: 'startDate',
      type: 'date',
      index: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' }
      }
    },
    {
      name: 'endDate',
      type: 'date',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' }
      }
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Additional notes and planning details'
      }
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        // Auto-generate slugs for content items if title exists but slug doesn't
        if (data.contentItems && Array.isArray(data.contentItems)) {
          data.contentItems = data.contentItems.map((item: any) => {
            if (item.title && (!item.slug || item.slug.trim() === '')) {
              item.slug = generateSlug(item.title)
            }
            return item
          })
        }
        return data
      }
    ],
    beforeChange: [
      ({ data }) => {
        if (!data) return data
        console.log('🔄 ContentPlans beforeChange hook triggered')
        console.log('📝 Data received:', {
          hasDescription: !!data?.description,
          descriptionLength: data?.description ? data.description.length : 0,
          hasContentItems: !!data?.contentItems,
          contentItemsLength: data?.contentItems ? data.contentItems.length : 0
        })

        /**
         * JSON-to-ContentItems Conversion Logic
         * 
         * This hook automatically converts JSON data from the Description field into structured Content Items
         * while preserving the original JSON content in the Description field.
         * 
         * Key Features:
         * - Preserves original JSON content in Description field (no clearing)
         * - Prevents duplicate content items on subsequent saves
         * - Handles malformed JSON gracefully with detailed error logging
         * - Supports both empty descriptions and non-JSON text content
         * 
         * Conversion Conditions:
         * 1. Description field contains content
         * 2. Content Items array is empty (prevents duplication)
         * 3. Description content is valid JSON array format
         */
        if (data.description &&
          (!data.contentItems || data.contentItems.length === 0) &&
          typeof data.description === 'string' &&
          data.description.trim().length > 0) {

          console.log('🔍 Attempting to parse description as JSON for Content Items conversion...')

          try {
            // Attempt to parse the description as JSON
            const parsedData = JSON.parse(data.description.trim())
            console.log('✅ JSON parsing successful:', {
              type: Array.isArray(parsedData) ? 'Array' : typeof parsedData,
              length: Array.isArray(parsedData) ? parsedData.length : 'N/A',
              preservingOriginal: true
            })

            // Validate that parsed data is a non-empty array
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              console.log('🔄 Converting JSON array to Content Items (preserving original JSON)...')

              // Convert the JSON structure to contentItems format
              const convertedItems = []

              for (let index = 0; index < parsedData.length; index++) {
                const item = parsedData[index]
                console.log(`  Processing item ${index + 1}: ${item?.title || 'Untitled'}`)

                try {
                  const contentItem: any = {
                    title: item?.title || `Content Item ${index + 1}`,
                    slug: item?.slug || generateSlug(item?.title || `content-item-${index + 1}`),
                    description: item?.description || '',
                    keywords: [],
                    prompt: typeof item?.prompt === 'string' ? item.prompt : '',
                    audience: typeof item?.audience === 'string' ? item.audience : '',
                    goal: typeof item?.goal === 'string' ? item.goal : '',
                    region: typeof item?.region === 'string' ? item.region : '',
                    word_count: (() => {
                      const wc = (item as any)?.word_count ?? (item as any)?.wordCount
                      const n = Number(wc)
                      return Number.isFinite(n) && n >= 0 ? n : undefined
                    })(),
                    // Only use the dynamic array field for image prompts
                    image_prompts: []
                  }

                  // Convert keywords array to nested structure with validation
                  if (item?.keywords && Array.isArray(item.keywords)) {
                    contentItem.keywords = item.keywords
                      .filter((keyword: any) => typeof keyword === 'string' && keyword.trim().length > 0)
                      .map((keyword: string) => ({
                        keyword: keyword.trim()
                      }))
                    console.log(`    Added ${contentItem.keywords.length} valid keywords`)
                  }

                  // Build image_prompts array from either JSON array or legacy fields
                  const extractedPrompts: string[] = []
                  const imgArr = (item as any)?.image_prompts
                  if (Array.isArray(imgArr)) {
                    for (const p of imgArr) {
                      if (typeof p === 'string' && p.trim().length > 0) extractedPrompts.push(p.trim())
                      else if (p && typeof p === 'object' && typeof (p as any).prompt === 'string' && (p as any).prompt.trim().length > 0) {
                        extractedPrompts.push((p as any).prompt.trim())
                      }
                    }
                  }
                  ;['image_prompt_1','image_prompt_2','image_prompt_3','image_prompt_4','image_prompt_5'].forEach((k) => {
                    const v = (item as any)?.[k]
                    if (typeof v === 'string' && v.trim().length > 0) extractedPrompts.push(v.trim())
                  })
                  if (extractedPrompts.length > 0) {
                    contentItem.image_prompts = extractedPrompts.map((prompt) => ({ prompt }))
                    console.log(`    Added ${contentItem.image_prompts.length} image prompts`)
                  }

                  convertedItems.push(contentItem)
                } catch (itemError) {
                  console.error(`❌ Error processing item ${index + 1}:`, (itemError as any)?.message)
                  // Continue processing other items even if one fails
                }
              }

              // Only assign if we successfully converted at least one item
              if (convertedItems.length > 0) {
                data.contentItems = convertedItems

                // IMPORTANT: Preserve the original JSON content in the Description field
                // This allows users to see the source JSON and make manual edits if needed
                console.log(`🎉 Successfully converted ${convertedItems.length} items to Content Items`)
                console.log('📋 Original JSON content preserved in Description field')
              } else {
                console.log('⚠️ No valid items could be converted from JSON array')
              }
            } else if (Array.isArray(parsedData)) {
              console.log('⚠️ Parsed JSON is an empty array, no Content Items to create')
            } else {
              console.log('⚠️ Parsed JSON is not an array format, skipping Content Items conversion')
            }
          } catch (parseError: any) {
            // Enhanced error handling for malformed JSON
            console.log('❌ Description field contains invalid JSON, preserving as-is:', {
              error: parseError.message,
              descriptionPreview: data.description.substring(0, 100) + (data.description.length > 100 ? '...' : ''),
              action: 'Preserving original content'
            })

            // Description field is preserved as-is when JSON parsing fails
            // This allows for regular text content in the description field
          }
        } else {
          // Log the reason for skipping conversion
          const skipReasons: string[] = []
          if (!data?.description || data.description.trim().length === 0) {
            skipReasons.push('Description field is empty')
          }
          if (data?.contentItems && data.contentItems.length > 0) {
            skipReasons.push('Content Items already exist (preventing duplication)')
          }
          if (typeof data?.description !== 'string') {
            skipReasons.push('Description is not a string')
          }

          console.log('⏭️ Skipping JSON-to-ContentItems conversion:', {
            reasons: skipReasons,
            hasDescription: !!data?.description,
            hasContentItems: !!(data?.contentItems && data.contentItems.length > 0),
            descriptionType: typeof data?.description
          })
        }

        // Ensure slug uniqueness within the same content plan
        if (data.contentItems && Array.isArray(data.contentItems)) {
          const slugs = new Set<string>()
          data.contentItems = data.contentItems.map((item: any) => {
            let slug = item.slug || generateSlug(item.title || '')
            const originalSlug = slug
            let counter = 1

            // Make slug unique within this content plan
            while (slugs.has(slug)) {
              slug = `${originalSlug}-${counter}`
              counter++
            }

            slugs.add(slug)
            item.slug = slug
            return item
          })
        }
        return data
      }
    ]
  }
}