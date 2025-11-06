import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getPostDisplayData,
  getSiteDisplayData,
  calculateReadingTime,
  formatDisplayDate,
  getAuthorInfo,
  getSocialShareUrls,
  generateDisplayBreadcrumbs,
  hasCustomSEO,
  getPerformanceHints,
  getPostTags,
  isPostVisible,
  getReadingStats,
} from '@/lib/frontend-utils'

// Mock data
const mockPost = {
  id: '1',
  title: 'Test Post Title',
  slug: 'test-post-title',
  excerpt: 'This is a test post excerpt that describes the content.',
  content: [
    {
      type: 'paragraph',
      children: [{ text: 'This is the first paragraph with some content.' }],
    },
    {
      type: 'paragraph',
      children: [{ text: 'This is the second paragraph with more content to read.' }],
    },
  ],
  datePublished: '2024-01-15T10:30:00.000Z',
  dateModified: '2024-01-16T14:45:00.000Z',
  status: 'published',
  featuredImage: {
    id: '1',
    url: 'https://test.com/featured.jpg',
    filename: 'featured.jpg',
    alt: 'Featured image',
  },
  author: {
    id: 'author1',
    name: 'John Doe',
    email: 'john@test.com',
    bio: 'Test author bio',
    avatar: {
      id: '2',
      url: 'https://test.com/avatar.jpg',
      filename: 'avatar.jpg',
      alt: 'Author avatar',
    },
  },
  tags: [
    { id: 'tag1', name: 'Technology', slug: 'technology' },
    { id: 'tag2', name: 'Web Development', slug: 'web-development' },
  ],
  categories: [
    { id: 'cat1', name: 'Programming', slug: 'programming' },
  ],
  seo: {
    pageTitle: 'Custom SEO Title',
    metaDescription: 'Custom meta description',
  },
}

const mockSiteConfig = {
  siteName: 'Test Blog',
  siteUrl: 'https://testblog.com',
  siteDescription: 'A test blog for developers',
  siteTagline: 'Learn, Build, Share',
  seoDefaults: {
    metaAuthor: 'Test Blog Team',
    robots: 'index,follow',
    charset: 'UTF-8',
    viewport: 'width=device-width, initial-scale=1',
    themeColor: '#1a202c',
    language: 'en',
  },
  openGraphDefaults: {
    ogSiteName: 'Test Blog',
    ogLocale: 'en_US',
    ogType: 'website',
    defaultOgImageAlt: 'Test Blog Logo',
  },
  twitterDefaults: {
    twitterCard: 'summary_large_image',
    twitterSite: '@testblog',
    twitterCreator: '@testblogteam',
  },
  socialMedia: {
    twitter: 'https://twitter.com/testblog',
    facebook: 'https://facebook.com/testblog',
    linkedin: 'https://linkedin.com/company/testblog',
  },
  performanceSettings: {
    cdnDomains: ['https://cdn.testblog.com'],
    analyticsDomains: ['https://analytics.testblog.com'],
    enableImageOptimization: true,
    enableLazyLoading: true,
  },
}

describe('Frontend Utils', () => {
  describe('getPostDisplayData', () => {
    it('should extract display data from post', () => {
      const displayData = getPostDisplayData(mockPost)
      
      expect(displayData.title).toBe('Test Post Title')
      expect(displayData.slug).toBe('test-post-title')
      expect(displayData.excerpt).toBe('This is a test post excerpt that describes the content.')
      expect(displayData.publishedDate).toBe('2024-01-15T10:30:00.000Z')
      expect(displayData.modifiedDate).toBe('2024-01-16T14:45:00.000Z')
      expect(displayData.featuredImage).toEqual({
        url: 'https://test.com/featured.jpg',
        alt: 'Featured image',
      })
      expect(displayData.author).toEqual({
        name: 'John Doe',
        bio: 'Test author bio',
        avatar: {
          url: 'https://test.com/avatar.jpg',
          alt: 'Author avatar',
        },
      })
      expect(displayData.tags).toEqual(['Technology', 'Web Development'])
      expect(displayData.categories).toEqual(['Programming'])
    })

    it('should handle post without optional fields', () => {
      const minimalPost = {
        id: '1',
        title: 'Minimal Post',
        slug: 'minimal-post',
        status: 'published',
      }
      
      const displayData = getPostDisplayData(minimalPost)
      
      expect(displayData.title).toBe('Minimal Post')
      expect(displayData.slug).toBe('minimal-post')
      expect(displayData.excerpt).toBe('')
      expect(displayData.featuredImage).toBeNull()
      expect(displayData.author).toBeNull()
      expect(displayData.tags).toEqual([])
      expect(displayData.categories).toEqual([])
    })

    it('should calculate reading time and word count', () => {
      const displayData = getPostDisplayData(mockPost)
      
      expect(displayData.readingTime).toBeGreaterThan(0)
      expect(displayData.wordCount).toBeGreaterThan(0)
    })
  })

  describe('getSiteDisplayData', () => {
    it('should extract site display data', () => {
      const displayData = getSiteDisplayData(mockSiteConfig)
      
      expect(displayData.name).toBe('Test Blog')
      expect(displayData.url).toBe('https://testblog.com')
      expect(displayData.description).toBe('A test blog for developers')
      expect(displayData.tagline).toBe('Learn, Build, Share')
      expect(displayData.socialMedia).toEqual({
        twitter: 'https://twitter.com/testblog',
        facebook: 'https://facebook.com/testblog',
        linkedin: 'https://linkedin.com/company/testblog',
      })
    })

    it('should handle minimal site config', () => {
      const minimalConfig = {
        siteName: 'Minimal Site',
        siteUrl: 'https://minimal.com',
      }
      
      const displayData = getSiteDisplayData(minimalConfig)
      
      expect(displayData.name).toBe('Minimal Site')
      expect(displayData.url).toBe('https://minimal.com')
      expect(displayData.description).toBe('')
      expect(displayData.tagline).toBe('')
      expect(displayData.socialMedia).toEqual({})
    })
  })

  describe('calculateReadingTime', () => {
    it('should calculate reading time correctly', () => {
      const text = 'This is a test text with exactly twenty words to test the reading time calculation function properly.'
      const readingTime = calculateReadingTime(text)
      
      // 20 words at 200 WPM should be 0.1 minutes, rounded up to 1 minute
      expect(readingTime).toBe(1)
    })

    it('should handle empty text', () => {
      expect(calculateReadingTime('')).toBe(0)
    })

    it('should handle long text', () => {
      const longText = 'word '.repeat(1000) // 1000 words
      const readingTime = calculateReadingTime(longText)
      
      // 1000 words at 200 WPM = 5 minutes
      expect(readingTime).toBe(5)
    })

    it('should use custom WPM', () => {
      const text = 'word '.repeat(100) // 100 words
      const readingTime = calculateReadingTime(text, 100) // 100 WPM
      
      // 100 words at 100 WPM = 1 minute
      expect(readingTime).toBe(1)
    })
  })

  describe('formatDisplayDate', () => {
    it('should format date correctly', () => {
      const date = '2024-01-15T10:30:00.000Z'
      const formatted = formatDisplayDate(date)
      
      expect(formatted).toMatch(/January 15, 2024/)
    })

    it('should handle custom format', () => {
      const date = '2024-01-15T10:30:00.000Z'
      const formatted = formatDisplayDate(date, 'short')
      
      expect(formatted).toMatch(/Jan 15, 2024/)
    })

    it('should handle invalid date', () => {
      const formatted = formatDisplayDate('invalid-date')
      expect(formatted).toBe('Invalid Date')
    })

    it('should handle custom locale', () => {
      const date = '2024-01-15T10:30:00.000Z'
      const formatted = formatDisplayDate(date, 'long', 'fr-FR')
      
      expect(formatted).toMatch(/janvier/)
    })
  })

  describe('getAuthorInfo', () => {
    it('should extract author info from post', () => {
      const authorInfo = getAuthorInfo(mockPost)
      
      expect(authorInfo).toEqual({
        name: 'John Doe',
        bio: 'Test author bio',
        avatar: {
          url: 'https://test.com/avatar.jpg',
          alt: 'Author avatar',
        },
        email: 'john@test.com',
      })
    })

    it('should handle post without author', () => {
      const postWithoutAuthor = { ...mockPost, author: undefined }
      const authorInfo = getAuthorInfo(postWithoutAuthor)
      
      expect(authorInfo).toBeNull()
    })

    it('should handle author without avatar', () => {
      const postWithAuthorNoAvatar = {
        ...mockPost,
        author: {
          id: 'author1',
          name: 'Jane Doe',
          email: 'jane@test.com',
          bio: 'Author without avatar',
        },
      }
      
      const authorInfo = getAuthorInfo(postWithAuthorNoAvatar)
      
      expect(authorInfo?.avatar).toBeNull()
    })
  })

  describe('getSocialShareUrls', () => {
    it('should generate social share URLs', () => {
      const shareUrls = getSocialShareUrls(mockPost, mockSiteConfig)
      
      expect(shareUrls.twitter).toContain('https://twitter.com/intent/tweet')
      expect(shareUrls.twitter).toContain(encodeURIComponent('Test Post Title'))
      expect(shareUrls.twitter).toContain(encodeURIComponent('https://testblog.com/posts/test-post-title'))
      
      expect(shareUrls.facebook).toContain('https://www.facebook.com/sharer/sharer.php')
      expect(shareUrls.facebook).toContain(encodeURIComponent('https://testblog.com/posts/test-post-title'))
      
      expect(shareUrls.linkedin).toContain('https://www.linkedin.com/sharing/share-offsite')
      expect(shareUrls.linkedin).toContain(encodeURIComponent('https://testblog.com/posts/test-post-title'))
      
      expect(shareUrls.email).toContain('mailto:')
      expect(shareUrls.email).toContain(encodeURIComponent('Test Post Title'))
    })

    it('should handle custom share text', () => {
      const customText = 'Check out this amazing post!'
      const shareUrls = getSocialShareUrls(mockPost, mockSiteConfig, customText)
      
      expect(shareUrls.twitter).toContain(encodeURIComponent(customText))
    })
  })

  describe('generateDisplayBreadcrumbs', () => {
    it('should generate breadcrumbs for post', () => {
      const breadcrumbs = generateDisplayBreadcrumbs(mockPost, mockSiteConfig)
      
      expect(breadcrumbs).toEqual([
        { label: 'Home', url: 'https://testblog.com', isActive: false },
        { label: 'Posts', url: 'https://testblog.com/posts', isActive: false },
        { label: 'Test Post Title', url: 'https://testblog.com/posts/test-post-title', isActive: true },
      ])
    })

    it('should use custom SEO title if available', () => {
      const breadcrumbs = generateDisplayBreadcrumbs(mockPost, mockSiteConfig)
      
      // Should use the actual title, not the SEO title for breadcrumbs
      expect(breadcrumbs[2].label).toBe('Test Post Title')
    })

    it('should handle post with category', () => {
      const postWithCategory = {
        ...mockPost,
        categories: [{ id: 'cat1', name: 'Programming', slug: 'programming' }],
      }
      
      const breadcrumbs = generateDisplayBreadcrumbs(postWithCategory, mockSiteConfig, true)
      
      expect(breadcrumbs).toEqual([
        { label: 'Home', url: 'https://testblog.com', isActive: false },
        { label: 'Posts', url: 'https://testblog.com/posts', isActive: false },
        { label: 'Programming', url: 'https://testblog.com/categories/programming', isActive: false },
        { label: 'Test Post Title', url: 'https://testblog.com/posts/test-post-title', isActive: true },
      ])
    })
  })

  describe('hasCustomSEO', () => {
    it('should detect custom SEO', () => {
      expect(hasCustomSEO(mockPost)).toBe(true)
    })

    it('should return false for post without SEO', () => {
      const postWithoutSEO = { ...mockPost, seo: undefined }
      expect(hasCustomSEO(postWithoutSEO)).toBe(false)
    })

    it('should return false for empty SEO object', () => {
      const postWithEmptySEO = { ...mockPost, seo: {} }
      expect(hasCustomSEO(postWithEmptySEO)).toBe(false)
    })
  })

  describe('getPerformanceHints', () => {
    it('should generate performance hints', () => {
      const hints = getPerformanceHints(mockPost, mockSiteConfig)
      
      expect(hints).toHaveProperty('preload')
      expect(hints).toHaveProperty('prefetch')
      expect(hints).toHaveProperty('preconnect')
      
      expect(Array.isArray(hints.preload)).toBe(true)
      expect(Array.isArray(hints.prefetch)).toBe(true)
      expect(Array.isArray(hints.preconnect)).toBe(true)
    })

    it('should include featured image in preload', () => {
      const hints = getPerformanceHints(mockPost, mockSiteConfig)
      
      expect(hints.preload).toContain('https://test.com/featured.jpg')
    })

    it('should include CDN domains in preconnect', () => {
      const hints = getPerformanceHints(mockPost, mockSiteConfig)
      
      expect(hints.preconnect).toContain('https://cdn.testblog.com')
      expect(hints.preconnect).toContain('https://analytics.testblog.com')
    })
  })

  describe('getPostTags', () => {
    it('should extract tag names from post', () => {
      const tags = getPostTags(mockPost)
      
      expect(tags).toEqual(['Technology', 'Web Development'])
    })

    it('should handle post without tags', () => {
      const postWithoutTags = { ...mockPost, tags: undefined }
      const tags = getPostTags(postWithoutTags)
      
      expect(tags).toEqual([])
    })

    it('should handle empty tags array', () => {
      const postWithEmptyTags = { ...mockPost, tags: [] }
      const tags = getPostTags(postWithEmptyTags)
      
      expect(tags).toEqual([])
    })
  })

  describe('isPostVisible', () => {
    it('should return true for published post', () => {
      expect(isPostVisible(mockPost)).toBe(true)
    })

    it('should return false for draft post', () => {
      const draftPost = { ...mockPost, status: 'draft' }
      expect(isPostVisible(draftPost)).toBe(false)
    })

    it('should return true for draft in preview mode', () => {
      const draftPost = { ...mockPost, status: 'draft' }
      expect(isPostVisible(draftPost, true)).toBe(true)
    })

    it('should handle future publication date', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      
      const futurePost = {
        ...mockPost,
        datePublished: futureDate.toISOString(),
      }
      
      expect(isPostVisible(futurePost)).toBe(false)
    })

    it('should show future post in preview mode', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      
      const futurePost = {
        ...mockPost,
        datePublished: futureDate.toISOString(),
      }
      
      expect(isPostVisible(futurePost, true)).toBe(true)
    })
  })

  describe('getReadingStats', () => {
    it('should calculate reading statistics', () => {
      const stats = getReadingStats(mockPost)
      
      expect(stats).toHaveProperty('wordCount')
      expect(stats).toHaveProperty('readingTime')
      expect(stats).toHaveProperty('characterCount')
      expect(stats).toHaveProperty('paragraphCount')
      
      expect(stats.wordCount).toBeGreaterThan(0)
      expect(stats.readingTime).toBeGreaterThan(0)
      expect(stats.characterCount).toBeGreaterThan(0)
      expect(stats.paragraphCount).toBeGreaterThan(0)
    })

    it('should handle post without content', () => {
      const postWithoutContent = { ...mockPost, content: undefined }
      const stats = getReadingStats(postWithoutContent)
      
      expect(stats.wordCount).toBe(0)
      expect(stats.readingTime).toBe(0)
      expect(stats.characterCount).toBe(0)
      expect(stats.paragraphCount).toBe(0)
    })

    it('should count paragraphs correctly', () => {
      const stats = getReadingStats(mockPost)
      
      // mockPost has 2 paragraphs
      expect(stats.paragraphCount).toBe(2)
    })
  })
})