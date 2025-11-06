import type { CollectionConfig } from 'payload'
import { 
  extractPlainText,
  countWords
} from '@/lib/seo-utils'
import { globalPerformanceMonitor } from '@/lib/performance-monitor'

// Type definitions for better type safety
interface RichTextContent {
  [key: string]: unknown
}

interface MediaDocument {
  id?: string | number
  url?: string
  filename?: string
  alt?: string
  width?: number
  height?: number
}

interface PostDocument {
  id?: string | number
  title?: string
  slug?: string
  content?: RichTextContent
  status?: 'draft' | 'published' | 'archived'
  datePublished?: string
  dateModified?: string
  featuredImage?: MediaDocument | string
  author?: unknown
  tags?: unknown[]
  categories?: unknown[]
  seo?: {
    pageTitle?: string
    metaDescription?: string
    metaKeywords?: string
    canonicalURL?: string
  }
  openGraph?: {
    ogTitle?: string
    ogDescription?: string
    ogImage?: MediaDocument | string
  }
  twitter?: {
    twitterTitle?: string
    twitterDescription?: string
    twitterImage?: MediaDocument | string
  }
  jsonld?: {
    headline?: string
    schemaDescription?: string
    wordCount?: number
  }
  metadata?: {
    readingTime?: number
    wordCount?: number
    lastModified?: string
  }
  seoComputed?: Record<string, unknown>
}

// Helper function to generate slug from title
function formatSlug(val: string): string {
  return val
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase()
}

// Helper function to extract plain text from rich text content
function richTextToPlainText(richText: RichTextContent): string {
  return extractPlainText(richText)
}

// Helper function to count words in content
function getWordCount(content: RichTextContent): number {
  const plainText = richTextToPlainText(content)
  return countWords(plainText)
}

// Remove circular references from objects/arrays to avoid deep copy recursion
function removeCircularRefs<T>(input: T): T {
  const seen = new WeakSet()
  const clone = (value: unknown): unknown => {
    if (value && typeof value === 'object') {
      if (seen.has(value)) return undefined
      seen.add(value)
      if (Array.isArray(value)) return value.map(clone)
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(value)) {
        out[k] = clone(v)
      }
      return out
    }
    return value
  }
  return clone(input) as T
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: 'Post',
    plural: 'Posts',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'datePublished', 'author'],
    group: 'Content',
    description: 'Manage blog posts and articles',
    pagination: {
      defaultLimit: 20,
    },
    preview: (doc: PostDocument) => {
      const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
      return `${base}/posts/${doc?.slug || ''}`
    },
  },
  // Disable versions/drafts temporarily to avoid deep copy recursion while creating
  versions: false,
  timestamps: true,
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    // Core Content Fields
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'The main title of the post',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL-friendly version of the title',
      },
      // Slug is auto-generated from title in beforeValidate hook
      hooks: {
        beforeValidate: [
          ({ value, data, operation }) => {
            const current = typeof value === 'string' ? value : ''
            if ((operation === 'create' || !current) && data?.title) {
              return formatSlug(String(data.title))
            }
            return current
          },
        ],
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description: 'Brief description of the post (used for meta description if not overridden)',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Main image for the post (used for Open Graph and Twitter cards)',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'The main content of the post',
      },
    },
    {
      name: 'postContentDraft',
      type: 'text',
      label: 'Post Content Draft',
      admin: {
        description: 'Temporary draft text for the post',
      },
    },
    
    // Relationship Fields
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Author of this post',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      index: true,
      admin: {
        description: 'Tags associated with this post',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      index: true,
      admin: {
        description: 'Categories for this post',
      },
    },
    
    // Publishing Fields
    {
      name: 'datePublished',
      type: 'date',
      index: true,
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'When this post was first published',
      },
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'dateModified',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'When this post was last modified',
      },
    },
    {
      name: 'plannedPublishDate',
      type: 'date',
      index: true,
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Target publish date (from Content Plan)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Publication status of the post',
      },
    },
    
    // Metadata Group (computed fields)
    {
      name: 'metadata',
      type: 'group',
      admin: {
        readOnly: true,
        description: 'Automatically computed metadata',
      },
      fields: [
        {
          name: 'readingTime',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Estimated reading time in minutes',
          },
        },
        {
          name: 'wordCount',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Total word count',
          },
        },
        {
          name: 'lastModified',
          type: 'date',
          admin: {
            readOnly: true,
            description: 'Last modification timestamp',
          },
        },
      ],
    },
    
    // SEO Override Fields (Simplified to prevent recursion)
    {
      name: 'seo',
      type: 'group',
      label: 'SEO Overrides',
      admin: {
        description: 'Override site-wide SEO settings for this specific post',
      },
      fields: [
        {
          name: 'pageTitle',
          type: 'text',
          admin: {
            description: 'Override the page title (defaults to post title)',
          },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          admin: {
            description: 'Override meta description (defaults to excerpt)',
          },
        },
        {
          name: 'metaKeywords',
          type: 'text',
          admin: {
            description: 'Comma-separated keywords for this post',
          },
        },
        {
          name: 'canonicalURL',
          type: 'text',
          admin: {
            description: 'Override canonical URL (defaults to post URL)',
          },
        },
      ],
    },
    // Admin-side action: Generate SEO button near overrides
    {
      name: 'generateSEOAction',
      type: 'ui',
      label: 'Generate SEO',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/GenerateSEOButton',
        },
        disableListColumn: true,
      },
    },
    // Admin-side action: Generate Article from Draft
    {
      name: 'generateArticleAction',
      type: 'ui',
      label: 'Create Article',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/GenerateArticleButton',
        },
        disableListColumn: true,
      },
    },
    // Open Graph Overrides (Simplified)
    {
      name: 'openGraph',
      type: 'group',
      label: 'Open Graph Overrides',
      admin: {
        description: 'Override Open Graph settings',
      },
      fields: [
        {
          name: 'ogTitle',
          type: 'text',
          admin: {
            description: 'Override Open Graph title',
          },
        },
        {
          name: 'ogDescription',
          type: 'textarea',
          admin: {
            description: 'Override Open Graph description',
          },
        },
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Override Open Graph image (defaults to featured image)',
          },
        },
      ],
    },
    
    // Twitter Overrides (Simplified)
    {
      name: 'twitter',
      type: 'group',
      label: 'Twitter Overrides',
      admin: {
        description: 'Override Twitter card settings',
      },
      fields: [
        {
          name: 'twitterTitle',
          type: 'text',
          admin: {
            description: 'Override Twitter card title',
          },
        },
        {
          name: 'twitterDescription',
          type: 'textarea',
          admin: {
            description: 'Override Twitter card description',
          },
        },
        {
          name: 'twitterImage',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Override Twitter card image (defaults to featured image)',
          },
        },
      ],
    },
    // Schema.org Overrides (Simplified)
    {
      name: 'jsonld',
      type: 'group',
      label: 'Schema.org Overrides',
      admin: {
        description: 'Override structured data settings',
      },
      fields: [
        {
          name: 'headline',
          type: 'text',
          admin: {
            description: 'Override schema headline (defaults to title)',
          },
        },
        {
          name: 'schemaDescription',
          type: 'textarea',
          admin: {
            description: 'Override schema description',
          },
        },
        {
          name: 'wordCount',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Automatically calculated word count',
          },
        },
      ],
    },
    
    // Computed fields (read-only, populated by hooks)
    {
      name: 'seoComputed',
      type: 'json',
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        const timer = globalPerformanceMonitor.startRequest(
          `post_beforeValidate_${Date.now()}`,
          'post_beforeValidate'
        )
        
        try {
          if (!data) return data
          
          // Auto-generate slug if not provided
          if (operation === 'create' && !data.slug) {
            if (data.title) {
              data.slug = formatSlug(String(data.title))
            } else {
              data.slug = `untitled-${Date.now()}`
            }
          }
          // Sanitize entire payload to avoid circular references
          data = removeCircularRefs(data)

          // Development: log the shape of data to help diagnose
          if (req?.payload?.logger) {
            const summary: Record<string, string> = {}
            for (const key of Object.keys(data ?? {})) {
              const val = (data as Record<string, unknown>)[key]
              summary[key] = Array.isArray(val) ? 'array' : typeof val
            }
            req.payload.logger.info(`beforeValidate data keys: ${JSON.stringify(summary)}`)
          }
          
          timer.end({ success: 'true' })
          return data
        } catch (error) {
          globalPerformanceMonitor.recordError(error as Error, { 
            hook: 'beforeValidate',
            operation 
          })
          timer.end({ success: 'false' })
          throw error
        }
      },
    ],
    beforeChange: [
      async ({ data, operation, req }) => {
        const timer = globalPerformanceMonitor.startRequest(
          `post_beforeChange_${Date.now()}`,
          'post_beforeChange'
        )
        
        try {
          // Update dateModified on any change
          if (operation === 'update') {
            data.dateModified = new Date().toISOString()
          }
          
          // Set datePublished if publishing for the first time
          if (data.status === 'published' && !data.datePublished) {
            data.datePublished = new Date().toISOString()
          }

          // Sanitize entire payload to avoid circular references before saving
          data = removeCircularRefs(data)

          // Development: log the shape of data to help diagnose
          if (req?.payload?.logger) {
            const summary: Record<string, string> = {}
            for (const key of Object.keys(data ?? {})) {
              const val = (data as Record<string, unknown>)[key]
              summary[key] = Array.isArray(val) ? 'array' : typeof val
            }
            req.payload.logger.info(`beforeChange data keys: ${JSON.stringify(summary)}`)
          }

          // Calculate word count
          if (data.content) {
            const wordCount = getWordCount(data.content as RichTextContent)
            if (!data.jsonld) data.jsonld = {}
            data.jsonld.wordCount = wordCount
          }
          
          timer.end({ success: 'true' })
          return data
        } catch (error) {
          globalPerformanceMonitor.recordError(error as Error, { 
            hook: 'beforeChange',
            operation 
          })
          timer.end({ success: 'false' })
          throw error
        }
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        const timer = globalPerformanceMonitor.startRequest(
          `post_afterChange_${Date.now()}`,
          'post_afterChange'
        )
        
        try {
          // Log post changes
          if (req.payload.logger) {
            req.payload.logger.info(`Post ${operation} - ID: ${doc.id || `temp-${Date.now()}`}, Title: ${doc.title}, Status: ${doc.status}`)
          }
          
          timer.end({ success: 'true' })
          return doc
        } catch (error) {
          globalPerformanceMonitor.recordError(error as Error, { 
            hook: 'afterChange',
            operation 
          })
          timer.end({ success: 'false' })
          throw error
        }
      },
    ],
    beforeRead: [
      async ({ doc, req: _req }) => {
        const timer = globalPerformanceMonitor.startRequest(
          `post_beforeRead_${Date.now()}`,
          'post_beforeRead'
        )
        
        try {
          // Enhance post data before reading
          // This could include adding computed fields or modifying data
          
          timer.end({ success: 'true' })
          return doc
        } catch (error) {
          globalPerformanceMonitor.recordError(error as Error, { 
            hook: 'beforeRead',
            postId: doc?.id 
          })
          timer.end({ success: 'false' })
          throw error
        }
      },
    ],
    afterRead: [],
  },
}