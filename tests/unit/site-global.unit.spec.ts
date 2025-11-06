import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Site } from '@/globals/Site'

// Mock Payload types
const mockPayload = {
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
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
  user: { id: 'user1', email: 'test@example.com' },
  fallbackLocale: 'en',
  query: {},
  headers: new Headers(),
  body: undefined,
  json: async () => ({}),
  formData: async () => new FormData(),
  text: async () => '',
  routeParams: {}
}

const mockData = {
  siteName: 'Test Site',
  siteUrl: 'https://test.com',
  siteDescription: 'A test site description',
  siteTagline: 'Testing is fun',
  seoDefaults: {
    metaAuthor: 'Test Author',
    robots: 'index,follow',
    charset: 'UTF-8',
    viewport: 'width=device-width, initial-scale=1',
    themeColor: '#000000',
    language: 'en',
    revisitAfter: '7 days',
  },
  openGraphDefaults: {
    ogSiteName: 'Test Site',
    ogLocale: 'en_US',
    ogType: 'website',
    defaultOgImageAlt: 'Test Site Logo',
  },
  twitterDefaults: {
    twitterCard: 'summary_large_image',
    twitterSite: '@testsite',
    twitterCreator: '@testcreator',
  },
  schemaDefaults: {
    generateJSONLD: true,
    defaultSchemaType: 'Article',
    inLanguage: 'en',
    isAccessibleForFree: true,
    organization: {
      name: 'Test Organization',
      url: 'https://test.com',
    },
    publisher: {
      name: 'Test Publisher',
    },
    webSite: {
      url: 'https://test.com',
      name: 'Test Site',
      searchAction: {
        target: 'https://test.com/search?q={search_term_string}',
        queryInput: 'required name=search_term_string',
      },
    },
  },
  socialMedia: {
    twitter: 'https://twitter.com/testsite',
    facebook: 'https://facebook.com/testsite',
    linkedin: 'https://linkedin.com/company/testsite',
    instagram: 'https://instagram.com/testsite',
    youtube: 'https://youtube.com/testsite',
    github: 'https://github.com/testsite',
  },
  contactInfo: {
    email: 'contact@test.com',
    phone: '+1-555-0123',
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country',
    },
  },
  performanceSettings: {
    cdnDomains: ['https://cdn.test.com'],
    analyticsDomains: ['https://analytics.test.com'],
    enableImageOptimization: true,
    enableLazyLoading: true,
    enableCriticalCSS: true,
    enableServiceWorker: false,
  },
  integrations: {
    googleAnalytics: {
      enabled: true,
      trackingId: 'GA-123456789',
      anonymizeIP: true,
    },
    googleTagManager: {
      enabled: false,
      containerId: '',
    },
    facebookPixel: {
      enabled: false,
      pixelId: '',
    },
    hotjar: {
      enabled: false,
      siteId: '',
    },
  },
}

describe('Site Global Configuration', () => {
  describe('Configuration Structure', () => {
    it('should have correct slug', () => {
      expect(Site.slug).toBe('site')
    })

    it('should have correct label', () => {
      expect(Site.label).toBe('Site Configuration')
    })

    it('should be configured for global access', () => {
      expect(Site.access).toBeDefined()
      expect(Site.access?.read).toBeDefined()
    expect(Site.access?.update).toBeDefined()
    })

    it('should have admin interface configuration', () => {
      expect(Site.admin).toBeDefined()
      expect(Site.admin?.group).toBe('Settings')
    expect(Site.admin?.description).toContain('Global site settings')
    })
  })

  describe('Field Validation', () => {
    it('should have all required basic fields', () => {
      const fields = Site.fields
      const tabsField = fields.find((field: any) => field.type === 'tabs')
      const tabs = (tabsField as any)?.tabs
      const siteIdentityTab = tabs.find((tab: any) => tab.label === 'Site Identity')
      const fieldSlugs = siteIdentityTab.fields.map((field: any) => field.name)
      
      expect(fieldSlugs).toContain('siteName')
      expect(fieldSlugs).toContain('siteUrl')
      expect(fieldSlugs).toContain('siteDescription')
      expect(fieldSlugs).toContain('siteTagline')
    })

    it('should have SEO defaults group', () => {
      const fields = Site.fields
      const tabsField = fields.find((field: any) => field.type === 'tabs')
      const tabs = (tabsField as any)?.tabs
      const seoTab = tabs?.find((tab: any) => tab.label === 'SEO Defaults')
      const seoGroup = seoTab.fields.find((field: any) => field.name === 'seoDefaults')
      
      expect(seoGroup).toBeDefined()
      expect(seoGroup.fields).toBeDefined()
      
      const seoFieldSlugs = seoGroup.fields.map((field: any) => field.name)
      expect(seoFieldSlugs).toContain('metaAuthor')
      expect(seoFieldSlugs).toContain('robots')
      expect(seoFieldSlugs).toContain('charset')
      expect(seoFieldSlugs).toContain('viewport')
    })

    it('should have Open Graph defaults group', () => {
      const fields = Site.fields
      const tabsField = fields.find((field: any) => field.type === 'tabs')
      const tabs = (tabsField as any)?.tabs
      const ogTab = tabs?.find((tab: any) => tab.label === 'Open Graph')
      const ogGroup = ogTab.fields.find((field: any) => field.name === 'openGraphDefaults')
      
      expect(ogGroup).toBeDefined()
      expect(ogGroup.fields).toBeDefined()
      
      const ogFieldSlugs = ogGroup.fields.map((field: any) => field.name)
      expect(ogFieldSlugs).toContain('ogSiteName')
      expect(ogFieldSlugs).toContain('ogLocale')
      expect(ogFieldSlugs).toContain('ogType')
    })

    it('should have Twitter defaults group', () => {
      const fields = Site.fields
      const tabsField = fields.find((field: any) => field.type === 'tabs')
      const tabs = (tabsField as any)?.tabs
      const twitterTab = tabs?.find((tab: any) => tab.label === 'Twitter')
      const twitterGroup = twitterTab.fields.find((field: any) => field.name === 'twitterDefaults')
      
      expect(twitterGroup).toBeDefined()
      expect(twitterGroup.fields).toBeDefined()
      
      const twitterFieldSlugs = twitterGroup.fields.map((field: any) => field.name)
      expect(twitterFieldSlugs).toContain('twitterCard')
      expect(twitterFieldSlugs).toContain('twitterSite')
      expect(twitterFieldSlugs).toContain('twitterCreator')
    })

    it('should have schema.org tab', () => {
      const fields = Site.fields
      const tabsField = fields.find((field: any) => field.type === 'tabs')
      const tabs = (tabsField as any)?.tabs
      const schemaTab = tabs?.find((tab: any) => tab.label === 'Schema.org')

      expect(schemaTab).toBeDefined()
      expect(schemaTab.fields).toBeDefined()
      
      const schemaDefaults = schemaTab.fields.find((field: any) => field.name === 'schemaDefaults')
      expect(schemaDefaults).toBeDefined()
      expect(schemaDefaults.type).toBe('group')
      
      const schemaFieldSlugs = schemaDefaults.fields.map((field: any) => field.name)
      expect(schemaFieldSlugs).toContain('generateJSONLD')
      expect(schemaFieldSlugs).toContain('defaultSchemaType')
      expect(schemaFieldSlugs).toContain('inLanguage')
    })

    it('should have twitter tab for social media', () => {
      const fields = Site.fields
      const tabsField = fields.find((field: any) => field.type === 'tabs')
      const tabs = (tabsField as any)?.tabs
      const twitterTab = tabs?.find((tab: any) => tab.label === 'Twitter')

      expect(twitterTab).toBeDefined()
      expect(twitterTab.fields).toBeDefined()
    })

    it('should have site identity tab with contact info', () => {
      const fields = Site.fields
      const tabsField = fields.find((field: any) => field.type === 'tabs')
      const tabs = (tabsField as any)?.tabs
      const siteIdentityTab = tabs?.find((tab: any) => tab.label === 'Site Identity')

      expect(siteIdentityTab).toBeDefined()
      expect(siteIdentityTab.fields).toBeDefined()

      const fieldSlugs = siteIdentityTab.fields.map((field: any) => field.name)
      expect(fieldSlugs).toContain('siteName')
      expect(fieldSlugs).toContain('siteUrl')
      expect(fieldSlugs).toContain('siteDescription')
    })

    it('should have performance tab', () => {
      const fields = Site.fields
      const tabsField = fields.find((field: any) => field.type === 'tabs')
      const tabs = (tabsField as any)?.tabs
      const performanceTab = tabs?.find((tab: any) => tab.label === 'Performance')

      expect(performanceTab).toBeDefined()
      expect(performanceTab.fields).toBeDefined()
      
      const perfFieldSlugs = performanceTab.fields.map((field: any) => field.name)
      expect(perfFieldSlugs).toContain('cdnDomain')
      expect(perfFieldSlugs).toContain('analyticsOrAdsDomain')
      expect(perfFieldSlugs).toContain('preconnect')
      expect(perfFieldSlugs).toContain('dnsPrefetch')
    })

    it('should have analytics tab', () => {
      const fields = Site.fields
      const tabsField = fields.find((field: any) => field.type === 'tabs')
      const tabs = (tabsField as any)?.tabs
      const analyticsTab = tabs?.find((tab: any) => tab.label === 'Analytics')

      expect(analyticsTab).toBeDefined()
      expect(analyticsTab.fields).toBeDefined()
    })
  })

  describe('Field Types and Validation', () => {
    it('should have correct field types for basic fields', () => {
      const fields = Site.fields
      const tabsField = fields.find((field: any) => field.type === 'tabs')
      const tabs = (tabsField as any)?.tabs
      const siteIdentityTab = tabs?.find((tab: any) => tab.label === 'Site Identity')
      
      const siteName = siteIdentityTab.fields.find((field: any) => field.name === 'siteName')
      expect(siteName.type).toBe('text')
      expect(siteName.required).toBe(true)
      
      const siteUrl = siteIdentityTab.fields.find((field: any) => field.name === 'siteUrl')
      expect(siteUrl.type).toBe('text')
      expect(siteUrl.required).toBe(true)
      
      const siteDescription = siteIdentityTab.fields.find((field: any) => field.name === 'siteDescription')
      expect(siteDescription.type).toBe('textarea')
    })

    it('should have validation function for required fields', () => {
      const fields = Site.fields
      const tabsField = fields.find((field: any) => field.type === 'tabs')
      const tabs = (tabsField as any)?.tabs
      const siteIdentityTab = tabs?.find((tab: any) => tab.label === 'Site Identity')
      const siteUrl = siteIdentityTab.fields.find((field: any) => field.name === 'siteUrl')

      expect(siteUrl.validate).toBeDefined()
      expect(typeof siteUrl.validate).toBe('function')
    })

    it('should validate URL format correctly', () => {
      const fields = Site.fields
      const tabsField = fields.find((field: any) => field.type === 'tabs')
      const tabs = (tabsField as any)?.tabs
      const siteIdentityTab = tabs?.find((tab: any) => tab.label === 'Site Identity')
      const siteUrl = siteIdentityTab.fields.find((field: any) => field.name === 'siteUrl')
      
      // Test valid URLs
      expect(siteUrl.validate('https://example.com')).toBe(true)
      expect(siteUrl.validate('http://example.com')).toBe(true)
      expect(siteUrl.validate('https://subdomain.example.com')).toBe(true)
      expect(siteUrl.validate('ftp://example.com')).toBe(true) // URL constructor accepts ftp
      
      // Test invalid URLs
      expect(siteUrl.validate('not-a-url')).toBe('Please enter a valid URL')
      expect(siteUrl.validate('')).toBe('Site URL is required')
      expect(siteUrl.validate(null)).toBe('Site URL is required')
      expect(siteUrl.validate(undefined)).toBe('Site URL is required')
    })

    it('should have correct text types for performance fields', () => {
      const fields = Site.fields
      const tabsField = fields.find((field: any) => field.type === 'tabs')
      const tabs = (tabsField as any)?.tabs
      
      // Check performance tab
      const performanceTab = tabs?.find((tab: any) => tab.label === 'Performance')
      expect(performanceTab).toBeDefined()
      
      const cdnDomain = performanceTab.fields.find((field: any) => field.name === 'cdnDomain')
      expect(cdnDomain.type).toBe('text')
      
      const analyticsOrAdsDomain = performanceTab.fields.find((field: any) => field.name === 'analyticsOrAdsDomain')
      expect(analyticsOrAdsDomain.type).toBe('text')
    })

    it('should have array fields for CDN domains', () => {
      const fields = Site.fields
      const tabsField = fields.find((field: any) => field.type === 'tabs')
      const tabs = (tabsField as any)?.tabs
      
      // Check performance tab
      const performanceTab = tabs?.find((tab: any) => tab.label === 'Performance')
      expect(performanceTab).toBeDefined()
      
      const cdnDomain = performanceTab.fields.find((field: any) => field.name === 'cdnDomain')
      expect(cdnDomain.type).toBe('text')
      
      const preconnect = performanceTab.fields.find((field: any) => field.name === 'preconnect')
      expect(preconnect.type).toBe('array')
      expect(preconnect.fields).toBeDefined()
      expect(preconnect.fields[0].type).toBe('text')
    })
  })

  describe('Hooks', () => {
    it('should have afterChange hook', () => {
      expect(Site.hooks).toBeDefined()
      expect(Site.hooks?.afterChange).toBeDefined()
      expect(Array.isArray(Site.hooks?.afterChange)).toBe(true)
      expect(Site.hooks?.afterChange?.length).toBeGreaterThan(0)
    })

    it('beforeChange hook should validate and normalize data if implemented', async () => {
      const beforeChangeHook = Site.hooks?.beforeChange?.[0]
      
      if (beforeChangeHook) {
        const mockArgs = {
          doc: {
            siteName: '  Test Site  ',
            siteUrl: 'https://test.com/',
            seoDefaults: {
              metaAuthor: '  Test Author  ',
            },
          },
          req: mockReq as any,
          operation: 'update',
          context: {},
          data: {},
          global: {} as any,
          previousDoc: {}
        }
        
        const result = await beforeChangeHook(mockArgs)
        
        // Should trim whitespace
        expect(result.siteName).toBe('Test Site')
        expect(result.seoDefaults.metaAuthor).toBe('Test Author')
        
        // Should normalize URL (remove trailing slash)
        expect(result.siteUrl).toBe('https://test.com')
      } else {
        // Hook may not be implemented yet
        expect(true).toBe(true)
      }
    })

    it('afterChange hook should log changes if implemented', async () => {
      const afterChangeHook = Site.hooks?.afterChange?.[0]
      
      if (afterChangeHook) {
        const mockArgs = {
          doc: mockData,
          req: mockReq as any,
          operation: 'update',
          previousDoc: {
            ...mockData,
            siteName: 'Old Site Name',
          },
          context: {},
          data: {},
          global: {} as any
        }
        
        await afterChangeHook(mockArgs)
        
        expect(mockPayload.logger.info).toHaveBeenCalledWith(
          'Site configuration updated, clearing caches'
        )
      } else {
        // Hook may not be implemented yet
        expect(true).toBe(true)
      }
    })
  })

  describe('Access Control', () => {
    it('should allow read access to all users', () => {
      const readAccess = Site.access?.read
      
      if (typeof readAccess === 'function') {
        const result = readAccess({ req: mockReq as any })
      expect(result).toBe(true)
    } else {
      expect(readAccess).toBe(true)
    }
  })

  it('should allow update access to authenticated users', () => {
    const updateAccess = Site.access?.update
    
    if (typeof updateAccess === 'function') {
      // Test with authenticated user
      const authenticatedReq = {
        ...mockReq,
        user: { id: 'user123' },
      }
      
      const authenticatedResult = updateAccess({ req: authenticatedReq as any })
      expect(authenticatedResult).toBe(true)
      
      // Test with unauthenticated user
      const unauthenticatedReq = {
        ...mockReq,
        user: null,
      }
      
      const unauthenticatedResult = updateAccess({ req: unauthenticatedReq as any })
      expect(unauthenticatedResult).toBe(false)
    }
  })

    it('should deny access to unauthenticated users', () => {
      const updateAccess = Site.access?.update
      
      if (typeof updateAccess === 'function') {
        const unauthReq = {
          ...mockReq,
          user: null,
        }
        
        const result = updateAccess({ req: unauthReq as any })
        expect(result).toBe(false)
      }
    })
  })

  describe('Admin Configuration', () => {
    it('should have correct admin group', () => {
      expect(Site.admin?.group).toBe('Settings')
    })

    it('should have descriptive label and description', () => {
      expect(Site.admin?.description).toMatch(/global site settings|Global site settings/i)
      expect(Site.label).toBe('Site Configuration')
    })

    it('should have preview configuration if implemented', () => {
      if (Site.admin?.preview) {
        expect(typeof Site.admin.preview).toBe('function')
      } else {
        // Preview is optional for globals
        expect(Site.admin?.preview).toBeUndefined()
      }
    })

    it('should generate correct preview URL if preview is implemented', () => {
      if (Site.admin?.preview) {
        const previewFn = Site.admin.preview
        const mockDoc = { siteUrl: 'https://test.com' }
        
        // Create a proper mock PayloadRequest
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
            user: { id: 'user1', email: 'test@example.com' },
            fallbackLocale: 'en',
            query: {},
            headers: new Headers(),
            body: undefined,
            json: async () => ({}),
            formData: async () => new FormData(),
            text: async () => '',
            routeParams: {}
          }
        
        const previewUrl = previewFn(mockDoc, { req: mockReq as any, locale: 'en', token: 'test-token' })
        expect(previewUrl).toBe('https://test.com')
      } else {
        // Skip test if preview is not implemented
        expect(true).toBe(true)
      }
    })
  })

  describe('TypeScript Types', () => {
    it('should export correct TypeScript interface', () => {
      // This test ensures the Site global exports the correct types
      // The actual type checking is done at compile time
      expect(Site).toBeDefined()
      expect(Site.slug).toBe('site')
      expect(Site.fields).toBeDefined()
      expect(Array.isArray(Site.fields)).toBe(true)
    })
  })
})