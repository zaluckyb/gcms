import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getMediaUrl,
  buildAbsoluteUrl,
  extractPlainText,
  countWords,
  generateBreadcrumbs,
  mergeSeoData,
  buildMetadata,
  buildJsonLd,
  computeWordCount,
  generatePerformanceHints,
  type Post,
  type SiteConfig,
  type MediaRel,
} from '../../src/lib/seo-utils'

// Mock data
const mockSiteConfig: SiteConfig = {
  siteName: 'Test Site',
  siteUrl: 'https://test.com',
  siteDescription: 'A test site',
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
}

const mockPost: Post = {
  id: '1',
  title: 'Test Post',
  slug: 'test-post',
  excerpt: 'This is a test post excerpt',
  content: [
    {
      type: 'paragraph',
      children: [{ text: 'This is test content with some words.' }],
    },
  ],
  datePublished: '2024-01-01T00:00:00.000Z',
  dateModified: '2024-01-02T00:00:00.000Z',
  status: 'published',
  featuredImage: {
    id: '1',
    url: 'https://test.com/image.jpg',
    filename: 'image.jpg',
    alt: 'Test image',
  },
}

describe('SEO Utils', () => {
  describe('getMediaUrl', () => {
    it('should return URL from media object', () => {
      const media: MediaRel = {
        id: '1',
        url: 'https://test.com/image.jpg',
        filename: 'image.jpg',
      }
      expect(getMediaUrl(media)).toBe('https://test.com/image.jpg')
    })

    it('should return string URL as-is', () => {
      expect(getMediaUrl('https://test.com/image.jpg')).toBe('https://test.com/image.jpg')
    })

    it('should return empty string for undefined', () => {
      expect(getMediaUrl(undefined)).toBe('')
    })

    it('should return empty string for media without URL', () => {
      const media: MediaRel = { id: '1', filename: 'image.jpg' }
      expect(getMediaUrl(media)).toBe('')
    })
  })

  describe('buildAbsoluteUrl', () => {
    it('should build absolute URL correctly', () => {
      expect(buildAbsoluteUrl('https://test.com', '/posts/test')).toBe('https://test.com/posts/test')
    })

    it('should handle base URL with trailing slash', () => {
      expect(buildAbsoluteUrl('https://test.com/', '/posts/test')).toBe('https://test.com/posts/test')
    })

    it('should handle path without leading slash', () => {
      expect(buildAbsoluteUrl('https://test.com', 'posts/test')).toBe('https://test.com/posts/test')
    })

    it('should return absolute URL if path is already absolute', () => {
      expect(buildAbsoluteUrl('https://test.com', 'https://other.com/test')).toBe('https://other.com/test')
    })
  })

  describe('extractPlainText', () => {
    it('should extract plain text from rich text content', () => {
      const content = [
        {
          type: 'paragraph',
          children: [{ text: 'Hello ' }, { text: 'world', bold: true }],
        },
        {
          type: 'heading',
          children: [{ text: 'Title' }],
        },
      ]
      expect(extractPlainText(content)).toBe('Hello world Title')
    })

    it('should handle empty content', () => {
      expect(extractPlainText([])).toBe('')
    })

    it('should handle undefined content', () => {
      expect(extractPlainText(undefined)).toBe('')
    })

    it('should handle nested structures', () => {
      const content = [
        {
          type: 'list',
          children: [
            {
              type: 'listItem',
              children: [{ text: 'Item 1' }],
            },
            {
              type: 'listItem',
              children: [{ text: 'Item 2' }],
            },
          ],
        },
      ]
      expect(extractPlainText(content)).toBe('Item 1 Item 2')
    })
  })

  describe('countWords', () => {
    it('should count words correctly', () => {
      expect(countWords('Hello world test')).toBe(3)
    })

    it('should handle empty string', () => {
      expect(countWords('')).toBe(0)
    })

    it('should handle multiple spaces', () => {
      expect(countWords('Hello    world   test')).toBe(3)
    })

    it('should handle punctuation', () => {
      expect(countWords('Hello, world! How are you?')).toBe(5)
    })
  })

  describe('generateBreadcrumbs', () => {
    it('should generate breadcrumbs for a post', () => {
      const breadcrumbs = generateBreadcrumbs(mockPost, mockSiteConfig)
      
      expect(breadcrumbs).toEqual([
        { name: 'Home', url: 'https://test.com' },
        { name: 'Posts', url: 'https://test.com/posts' },
        { name: 'Test Post', url: 'https://test.com/posts/test-post' },
      ])
    })

    it('should use custom title if available', () => {
      const postWithCustomTitle = {
        ...mockPost,
        seo: { pageTitle: 'Custom Title' },
      }
      
      const breadcrumbs = generateBreadcrumbs(postWithCustomTitle, mockSiteConfig)
      expect(breadcrumbs[2].name).toBe('Custom Title')
    })
  })

  describe('mergeSeoData', () => {
    it('should merge post and site SEO data correctly', () => {
      const result = mergeSeoData(mockPost, mockSiteConfig)
      
      expect(result.meta.title).toBe('Test Post')
      expect(result.meta.description).toBe('This is a test post excerpt')
      expect(result.meta.canonical).toBe('https://test.com/posts/test-post')
      expect(result.meta.author).toBe('Test Author')
      expect(result.meta.robots).toBe('index,follow')
    })

    it('should prioritize post-specific SEO overrides', () => {
      const postWithSEO = {
        ...mockPost,
        seo: {
          pageTitle: 'Custom Title',
          metaDescription: 'Custom description',
          canonicalURL: 'https://custom.com/post',
        },
      }
      
      const result = mergeSeoData(postWithSEO, mockSiteConfig)
      
      expect(result.meta.title).toBe('Custom Title')
      expect(result.meta.description).toBe('Custom description')
      expect(result.meta.canonical).toBe('https://custom.com/post')
    })

    it('should handle missing post data gracefully', () => {
      const emptyPost = { id: '1', slug: 'test' }
      const result = mergeSeoData(emptyPost, mockSiteConfig)
      
      expect(result.meta.title).toBe('Test Site')
      expect(result.meta.description).toBe('A test site')
    })
  })

  describe('buildMetadata', () => {
    it('should build Next.js metadata correctly', () => {
      const metadata = buildMetadata(mockPost, mockSiteConfig)
      
      expect(metadata.title).toBe('Test Post')
      expect(metadata.description).toBe('This is a test post excerpt')
      expect(metadata.alternates?.canonical).toBe('https://test.com/posts/test-post')
      expect((metadata.robots as any)?.index).toBe(true)
      expect((metadata.robots as any)?.follow).toBe(true)
    })

    it('should include Open Graph data', () => {
      const metadata = buildMetadata(mockPost, mockSiteConfig)
      
      expect(metadata.openGraph?.title).toBe('Test Post')
      expect(metadata.openGraph?.description).toBe('This is a test post excerpt')
      expect(metadata.openGraph?.url).toBe('https://test.com/posts/test-post')
      expect(metadata.openGraph?.siteName).toBe('Test Site')
      expect(metadata.openGraph?.locale).toBe('en_US')
      expect((metadata.openGraph as any)?.type).toBe('article')
    })

    it('should include Twitter data', () => {
      const metadata = buildMetadata(mockPost, mockSiteConfig)
      
      expect((metadata.twitter as any)?.card).toBe('summary_large_image')
      expect(metadata.twitter?.title).toBe('Test Post')
      expect(metadata.twitter?.description).toBe('This is a test post excerpt')
      expect(metadata.twitter?.site).toBe('@testsite')
      expect(metadata.twitter?.creator).toBe('@testcreator')
    })

    it('should handle images correctly', () => {
      const metadata = buildMetadata(mockPost, mockSiteConfig)
      
      expect(metadata.openGraph?.images).toEqual([
        {
          url: 'https://test.com/image.jpg',
          alt: 'Test image',
        },
      ])
    })
  })

  describe('buildJsonLd', () => {
    it('should build JSON-LD structured data', () => {
      const jsonLd = buildJsonLd(mockPost, mockSiteConfig)
      
      expect(Array.isArray(jsonLd)).toBe(true)
      expect(jsonLd.length).toBeGreaterThan(0)
      
      // Check for Organization
      const org = jsonLd.find(item => item['@type'] === 'Organization')
      expect(org).toBeDefined()
      expect(org?.name).toBe('Test Organization')
      expect(org?.url).toBe('https://test.com')
      
      // Check for Article
      const article = jsonLd.find(item => item['@type'] === 'Article')
      expect(article).toBeDefined()
      expect(article?.headline).toBe('Test Post')
      expect(article?.description).toBe('This is a test post excerpt')
      expect(article?.datePublished).toBe('2024-01-01T00:00:00.000Z')
      expect(article?.dateModified).toBe('2024-01-02T00:00:00.000Z')
    })

    it('should include WebSite schema', () => {
      const jsonLd = buildJsonLd(mockPost, mockSiteConfig)
      
      const website = jsonLd.find(item => item['@type'] === 'WebSite')
      expect(website).toBeDefined()
      expect(website?.url).toBe('https://test.com')
      expect(website?.name).toBe('Test Site')
      expect(website?.potentialAction).toBeDefined()
    })

    it('should skip JSON-LD if disabled', () => {
      const configWithoutJsonLd = {
        ...mockSiteConfig,
        schemaDefaults: {
          ...mockSiteConfig.schemaDefaults!,
          generateJSONLD: false,
        },
      }
      
      const jsonLd = buildJsonLd(mockPost, configWithoutJsonLd)
      expect(jsonLd).toEqual([])
    })
  })

  describe('computeWordCount', () => {
    it('should compute word count from post content', () => {
      const wordCount = computeWordCount(mockPost)
      expect(wordCount).toBeGreaterThan(0)
    })

    it('should handle post without content', () => {
      const postWithoutContent = { ...mockPost, content: undefined, excerpt: '' }
      const wordCount = computeWordCount(postWithoutContent)
      expect(wordCount).toBe(0)
    })

    it('should prioritize existing word count', () => {
      const postWithWordCount = {
        ...mockPost,
        jsonld: { wordCount: 500 },
      }
      const wordCount = computeWordCount(postWithWordCount)
      expect(wordCount).toBe(500)
    })
  })

  describe('generatePerformanceHints', () => {
    it('should generate performance hints', () => {
      const hints = generatePerformanceHints(mockPost, mockSiteConfig)
      
      expect(hints).toHaveProperty('preconnect')
      expect(hints).toHaveProperty('dnsPrefetch')
      expect(hints).toHaveProperty('preload')
      expect(hints).toHaveProperty('prefetch')
      
      expect(Array.isArray(hints.preconnect)).toBe(true)
      expect(Array.isArray(hints.dnsPrefetch)).toBe(true)
      expect(Array.isArray(hints.preload)).toBe(true)
      expect(Array.isArray(hints.prefetch)).toBe(true)
    })

    it('should include CDN domains in preconnect', () => {
      const configWithCDN = {
        ...mockSiteConfig,
        performanceSettings: {
          cdnDomains: ['https://cdn.test.com'],
          analyticsDomains: ['https://analytics.test.com'],
        },
      }
      
      const hints = generatePerformanceHints(mockPost, configWithCDN)
      expect(hints.preconnect).toContain('https://cdn.test.com')
      expect(hints.preconnect).toContain('https://analytics.test.com')
    })

    it('should include featured image in preload', () => {
      const hints = generatePerformanceHints(mockPost, mockSiteConfig)
      expect(hints.preload).toContain('https://test.com/image.jpg')
    })
  })
})