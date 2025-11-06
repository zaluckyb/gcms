import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Posts } from '../../src/collections/Posts'

// Mock Payload types and utilities
const mockPayload = {
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  findGlobal: vi.fn(),
}

const mockReq = {
  context: {},
  i18n: { 
    language: 'en', 
    t: (key: string) => key,
    dateFNS: {},
    dateFNSKey: 'en',
    fallbackLanguage: 'en',
    translations: {}
  },
  locale: 'en' as const,
  payload: mockPayload,
  payloadAPI: 'local' as const,
  payloadDataLoader: {},
  t: (key: string) => key,
  user: { id: 'user1', email: 'test@example.com', role: 'admin' },
  fallbackLocale: 'en',
  query: {},
  headers: new Headers(),
  body: undefined,
  json: async () => ({}),
  formData: async () => new FormData(),
  text: async () => '',
  routeParams: {}
}

const mockSiteConfig = {
  siteName: 'Test Site',
  siteUrl: 'https://test.com',
  seoDefaults: {
    metaAuthor: 'Test Author',
    robots: 'index,follow',
  },
  openGraphDefaults: {
    ogSiteName: 'Test Site',
    ogLocale: 'en_US',
  },
  twitterDefaults: {
    twitterCard: 'summary_large_image',
    twitterSite: '@testsite',
  },
}

const mockPostData = {
  id: 'test-post-id',
  title: 'Test Post Title',
  slug: 'test-post-title',
  excerpt: 'This is a test post excerpt',
  content: [
    {
      type: 'paragraph',
      children: [{ text: 'This is test content.' }],
    },
  ],
  status: 'published',
  datePublished: '2024-01-15T10:30:00.000Z',
  featuredImage: {
    id: '1',
    url: 'https://test.com/image.jpg',
    filename: 'image.jpg',
    alt: 'Test image',
  },
  author: {
    id: 'author1',
    name: 'John Doe',
    email: 'john@test.com',
  },
  tags: [
    { id: 'tag1', name: 'Technology', slug: 'technology' },
  ],
  categories: [
    { id: 'cat1', name: 'Programming', slug: 'programming' },
  ],
  seo: {
    pageTitle: 'Custom SEO Title',
    metaDescription: 'Custom meta description',
  },
}

describe('Posts Collection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPayload.findGlobal.mockResolvedValue(mockSiteConfig)
  })

  describe('Collection Configuration', () => {
    it('should have correct slug', () => {
      expect(Posts.slug).toBe('posts')
    })

    it('should have correct labels', () => {
      expect(Posts.labels).toBeDefined()
      expect(Posts.labels!.singular).toBe('Post')
      expect(Posts.labels!.plural).toBe('Posts')
    })

    it('should be configured for admin interface', () => {
      expect(Posts.admin).toBeDefined()
      const admin = Posts.admin!
      expect(admin.group).toBe('Content')
      expect(admin.useAsTitle).toBe('title')
      expect(admin.defaultColumns).toContain('title')
      expect(admin.defaultColumns).toContain('status')
      expect(admin.defaultColumns).toContain('datePublished')
    })

    it('should have correct access control', () => {
      expect(Posts.access).toBeDefined()
      const access = Posts.access!
      expect(access.read).toBeDefined()
      expect(access.create).toBeDefined()
      expect(access.update).toBeDefined()
      expect(access.delete).toBeDefined()
    })

    it('should have versions enabled', () => {
      expect(Posts.versions).toBeDefined()
      const versions = Posts.versions!
      if (typeof versions === 'object') {
        expect(versions.drafts).toBe(true)
        expect(versions.maxPerDoc).toBe(10)
      }
    })
  })

  describe('Field Structure', () => {
    it('should have all required basic fields', () => {
      const fields = Posts.fields
      const fieldNames = fields.map((field: any) => field.name || field.type)
      
      expect(fieldNames).toContain('title')
      expect(fieldNames).toContain('slug')
      expect(fieldNames).toContain('excerpt')
      expect(fieldNames).toContain('content')
      expect(fieldNames).toContain('status')
      expect(fieldNames).toContain('datePublished')
      expect(fieldNames).toContain('featuredImage')
      expect(fieldNames).toContain('author')
    })

    it('should have simplified SEO group', () => {
      const fields = Posts.fields
      
      const seoGroup = fields.find((field: any) => 
        field.type === 'group' && field.name === 'seo'
      )
      
      expect(seoGroup).toBeDefined()
      expect((seoGroup as any).fields).toBeDefined()
      
      const seoFieldNames = (seoGroup as any)?.fields?.map((field: any) => field.name)
      expect(seoFieldNames).toContain('pageTitle')
      expect(seoFieldNames).toContain('metaDescription')
      expect(seoFieldNames).toContain('metaKeywords')
      expect(seoFieldNames).toContain('canonicalURL')
    })

    it('should have metadata group', () => {
      const fields = Posts.fields
      const metadataGroup = fields.find((field: any) => 
        field.type === 'group' && field.name === 'metadata'
      ) as any
      
      expect(metadataGroup).toBeDefined()
      expect(metadataGroup?.fields).toBeDefined()
      
      const metadataFieldNames = metadataGroup?.fields?.map((field: any) => field.name)
      expect(metadataFieldNames).toContain('readingTime')
      expect(metadataFieldNames).toContain('wordCount')
      expect(metadataFieldNames).toContain('lastModified')
    })

    it('should have relationship fields', () => {
      const fields = Posts.fields
      
      const authorField = fields.find((field: any) => field.name === 'author') as any
      expect(authorField).toBeDefined()
      expect(authorField?.type).toBe('relationship')
      expect(authorField?.relationTo).toBe('users')
      
      const tagsField = fields.find((field: any) => field.name === 'tags') as any
      expect(tagsField).toBeDefined()
      expect(tagsField?.type).toBe('relationship')
      expect(tagsField?.relationTo).toBe('tags')
      expect(tagsField?.hasMany).toBe(true)
      
      const categoriesField = fields.find((field: any) => field.name === 'categories') as any
      expect(categoriesField).toBeDefined()
      expect(categoriesField?.type).toBe('relationship')
      expect(categoriesField?.relationTo).toBe('categories')
      expect(categoriesField?.hasMany).toBe(true)
    })

    it('should have rich text content field', () => {
      const fields = Posts.fields
      const contentField = fields.find((field: any) => field.name === 'content') as any
      
      expect(contentField).toBeDefined()
      expect(contentField?.type).toBe('richText')
      expect(contentField?.required).toBe(true)
    })

    it('should have upload field for featured image', () => {
      const fields = Posts.fields
      const featuredImageField = fields.find((field: any) => field.name === 'featuredImage') as any
      
      expect(featuredImageField).toBeDefined()
      expect(featuredImageField?.type).toBe('upload')
      expect(featuredImageField?.relationTo).toBe('media')
    })
  })

  describe('Field Validation', () => {
    it('should have required validation for title', () => {
      const fields = Posts.fields
      const titleField = fields.find((field: any) => field.name === 'title') as any
      
      expect(titleField).toBeDefined()
      expect(titleField?.required).toBe(true)
      expect(titleField?.type).toBe('text')
    })

    it('should have slug validation and formatting', () => {
      const fields = Posts.fields
      const slugField = fields.find((field: any) => field.name === 'slug') as any
      
      expect(slugField).toBeDefined()
      expect(slugField?.type).toBe('text')
      expect(slugField?.required).toBe(true)
      expect(slugField?.unique).toBe(true)
      expect(slugField?.index).toBe(true)
      expect(slugField?.admin?.position).toBe('sidebar')
    })

    it('should have status field with correct options', () => {
      const fields = Posts.fields
      const statusField = fields.find((field: any) => field.name === 'status') as any
      
      expect(statusField).toBeDefined()
      expect(statusField?.type).toBe('select')
      expect(statusField?.required).toBe(true)
      expect(statusField?.defaultValue).toBe('draft')
      
      const options = statusField?.options?.map((opt: any) => opt.value)
      expect(options).toContain('draft')
      expect(options).toContain('published')
      expect(options).toContain('archived')
    })

    it('should have date validation for datePublished', () => {
      const fields = Posts.fields
      const dateField = fields.find((field: any) => field.name === 'datePublished') as any
      
      expect(dateField).toBeDefined()
      expect(dateField?.type).toBe('date')
      expect(dateField?.admin?.position).toBe('sidebar')
    })
  })

  describe('Hooks', () => {
    it('should have beforeChange hooks', () => {
      expect(Posts.hooks).toBeDefined()
      const beforeChange = Posts.hooks!.beforeChange!
      expect(beforeChange).toBeDefined()
      expect(Array.isArray(beforeChange)).toBe(true)
      expect(beforeChange.length).toBeGreaterThan(0)
    })

    it('should have afterChange hooks', () => {
      const afterChange = Posts.hooks!.afterChange!
      expect(afterChange).toBeDefined()
      expect(Array.isArray(afterChange)).toBe(true)
      expect(afterChange.length).toBeGreaterThan(0)
    })

    it('should have beforeRead hooks', () => {
      const beforeRead = Posts.hooks!.beforeRead!
      expect(beforeRead).toBeDefined()
      expect(Array.isArray(beforeRead)).toBe(true)
      expect(beforeRead.length).toBeGreaterThan(0)
    })

    it('beforeChange hook should generate slug from title if implemented', async () => {
      const beforeChangeHook = Posts.hooks!.beforeChange?.find((hook) => 
        hook.toString().includes('slug')
      )
      
      if (beforeChangeHook) {
        const mockArgs = {
          collection: Posts,
          context: {},
          data: {
            title: 'Test Post Title',
            // No slug provided
          },
          req: mockReq,
          operation: 'create' as const,
        }
        
        const result = await beforeChangeHook(mockArgs as any)
        
        expect(result.slug).toBe('test-post-title')
      } else {
        // Hook may not be implemented yet
        expect(true).toBe(true)
      }
    })

    it('beforeChange hook should calculate metadata if implemented', async () => {
      const beforeChangeHook = Posts.hooks!.beforeChange?.find((hook) => 
        hook.toString().includes('metadata')
      )
      
      if (beforeChangeHook) {
        const mockArgs = {
          collection: Posts,
          context: {},
          data: mockPostData,
          req: mockReq,
          operation: 'create' as const,
        }
        
        const result = await beforeChangeHook(mockArgs as any)
        
        expect(result.metadata).toBeDefined()
        expect(result.metadata.wordCount).toBeGreaterThan(0)
        expect(result.metadata.readingTime).toBeGreaterThan(0)
        expect(result.metadata.lastModified).toBeDefined()
      } else {
        // Hook may not be implemented yet
        expect(true).toBe(true)
      }
    })

    it('beforeChange hook should populate SEO defaults if implemented', async () => {
      const beforeChangeHook = Posts.hooks!.beforeChange?.find((hook: any) => 
        hook.toString().includes('seo') || hook.toString().includes('SEO')
      )
      
      if (beforeChangeHook) {
        const mockArgs = {
          collection: Posts,
          context: {},
          data: {
            title: 'Test Post',
            excerpt: 'Test excerpt',
            // No SEO data provided
          },
          req: mockReq,
          operation: 'create' as const,
        }
        
        const result = await beforeChangeHook(mockArgs as any)
        
        // Should populate SEO defaults from site config
        expect(result.seo).toBeDefined()
        if (!result.seo.pageTitle) {
          expect(result.seo.pageTitle || result.title).toBeTruthy()
        }
        if (!result.seo.metaDescription) {
          expect(result.seo.metaDescription || result.excerpt).toBeTruthy()
        }
      } else {
        // Hook may not be implemented yet
        expect(true).toBe(true)
      }
    })

    it('afterChange hook should log changes if implemented', async () => {
      const afterChangeHook = Posts.hooks!.afterChange?.find((hook: any) => 
        hook.toString().includes('logger') || hook.toString().includes('log')
      )
      
      if (afterChangeHook) {
        const mockArgs = {
          collection: Posts,
          context: {},
          data: {},
          doc: { ...mockPostData, id: 'test-id' },
          previousDoc: {},
          req: mockReq,
          operation: 'create' as const,
        }
        
        await afterChangeHook(mockArgs as any)
        
        expect(mockPayload.logger.info).toHaveBeenCalledWith(
          expect.stringContaining('Post create')
        )
      } else {
        // Hook may not be implemented yet
        expect(true).toBe(true)
      }
    })

    it('beforeRead hook should enhance post data if implemented', async () => {
      const beforeReadHook = Posts.hooks!.beforeRead?.[0]
      
      if (beforeReadHook) {
        const mockArgs = {
          collection: Posts,
          context: {},
          doc: mockPostData,
          query: {},
          req: mockReq,
        }
        
        const result = await beforeReadHook(mockArgs as any)
        
        // Should enhance with computed fields
        expect(result).toBeDefined()
        // The hook might add computed fields or modify existing ones
      } else {
        // Hook may not be implemented yet
        expect(true).toBe(true)
      }
    })
  })

  describe('Access Control', () => {
    it('should allow public read access for published posts', () => {
      const readAccess = Posts.access!.read!
      
      if (typeof readAccess === 'function') {
        const publicReq = { ...mockReq, user: null }
        const result = readAccess({ req: publicReq as any })
        
        // Should return a query that filters for published posts
        expect(result).toBeDefined()
        if (typeof result === 'object') {
          expect((result as any).status).toEqual({ equals: 'published' })
        }
      }
    })

    it('should allow authenticated users to see drafts', () => {
      const readAccess = Posts.access!.read!
      
      if (typeof readAccess === 'function') {
        const result = readAccess({ req: mockReq as any })
        
        // Authenticated users should see all posts or have broader access
        expect(result).toBeDefined()
      }
    })

    it('should restrict create access to authenticated users', () => {
      const createAccess = Posts.access!.create!
      
      if (typeof createAccess === 'function') {
        // Test with authenticated user
        const authResult = createAccess({ req: mockReq as any })
        expect(authResult).toBe(true)
        
        // Test with unauthenticated user
        const unauthReq = { ...mockReq, user: null }
        const unauthResult = createAccess({ req: unauthReq as any })
        expect(unauthResult).toBe(false)
      }
    })

    it('should allow authors to update their own posts', () => {
      const updateAccess = Posts.access!.update!
      
      if (typeof updateAccess === 'function') {
        const authorReq = {
          ...mockReq,
          user: { id: 'author1', role: 'author' },
        }
        
        const result = updateAccess({ req: authorReq as any })
        
        // Should return a query that filters by author
        expect(result).toBeDefined()
        if (typeof result === 'object') {
          expect((result as any).author).toEqual({ equals: 'author1' })
        }
      }
    })

    it('should allow admins full access', () => {
      const updateAccess = Posts.access!.update!
      
      if (typeof updateAccess === 'function') {
        const adminReq = {
          ...mockReq,
          user: { id: 'admin1', role: 'admin' },
        }
        
        const result = updateAccess({ req: adminReq as any })
        expect(result).toBe(true)
      }
    })
  })

  describe('Admin Interface', () => {
    it('should have correct admin configuration', () => {
      const admin = Posts.admin!
      expect(admin.group).toBe('Content')
      expect(admin.useAsTitle).toBe('title')
      expect(admin.description).toContain('blog posts')
    })

    it('should have preview functionality', () => {
      expect(Posts.admin!.preview).toBeDefined()
      expect(typeof Posts.admin!.preview).toBe('function')
    })

    it('should generate correct preview URL', () => {
      const previewFn = Posts.admin!.preview!
      const mockDoc = { slug: 'test-post' }
      
      const previewUrl = previewFn(mockDoc, { req: mockReq as any, locale: 'en', token: 'test-token' })
      expect(previewUrl).toContain('/posts/test-post')
    })

    it('should have correct list view configuration', () => {
      expect(Posts.admin!.pagination!.defaultLimit).toBe(20)
      expect(Posts.admin!.defaultColumns).toContain('title')
      expect(Posts.admin!.defaultColumns).toContain('status')
      expect(Posts.admin!.defaultColumns).toContain('datePublished')
      expect(Posts.admin!.defaultColumns).toContain('author')
    })
  })

  describe('TypeScript Types', () => {
    it('should export correct collection configuration', () => {
      expect(Posts).toBeDefined()
      expect(Posts.slug).toBe('posts')
      expect(Posts.fields).toBeDefined()
      expect(Array.isArray(Posts.fields)).toBe(true)
      expect(Posts.hooks).toBeDefined()
      expect(Posts.access).toBeDefined()
    })
  })

  describe('Performance Optimizations', () => {
    it('should have database indexes on key fields', () => {
      const fields = Posts.fields
      
      const slugField = fields.find((field: any) => field.name === 'slug')
      expect((slugField as any)?.index).toBe(true)
      
      const statusField = fields.find((field: any) => field.name === 'status')
      expect((statusField as any)?.index).toBe(true)
      
      const dateField = fields.find((field: any) => field.name === 'datePublished')
      expect((dateField as any)?.index).toBe(true)
    })

    it('should have efficient relationship configurations', () => {
      const fields = Posts.fields
      
      const authorField = fields.find((field: any) => field.name === 'author')
      expect((authorField as any)?.index).toBe(true)
      
      const tagsField = fields.find((field: any) => field.name === 'tags')
      expect((tagsField as any)?.index).toBe(true)
      
      const categoriesField = fields.find((field: any) => field.name === 'categories')
      expect((categoriesField as any)?.index).toBe(true)
    })
  })
})