import { extractPlainText, countWords } from './seo-utils'

// Types for frontend display data
export interface PostDisplayData {
  title: string
  slug: string
  excerpt: string
  publishedDate?: string
  modifiedDate?: string
  featuredImage: {
    url: string
    alt: string
  } | null
  author: {
    name: string
    bio: string
    avatar: {
      url: string
      alt: string
    } | null
    email?: string
  } | null
  tags: string[]
  categories: string[]
  readingTime: number
  wordCount: number
}

export interface SiteDisplayData {
  name: string
  url: string
  description: string
  tagline: string
  socialMedia: Record<string, string>
}

export interface AuthorInfo {
  name: string
  bio: string
  avatar: {
    url: string
    alt: string
  } | null
  email?: string
}

export interface SocialShareUrls {
  twitter: string
  facebook: string
  linkedin: string
  email: string
}

export interface DisplayBreadcrumb {
  label: string
  url: string
  isActive: boolean
}

export interface ReadingStats {
  wordCount: number
  readingTime: number
  characterCount: number
  paragraphCount: number
}

export interface PerformanceHints {
  preconnect: string[]
  dnsPrefetch: string[]
  preload: string[]
  prefetch: string[]
}

/**
 * Extract display data from a post for frontend rendering
 */
export function getPostDisplayData(post: any): PostDisplayData {
  const content = post.content || []
  const plainText = extractPlainText(content)
  const wordCount = countWords(plainText)
  const readingTime = calculateReadingTime(plainText)

  return {
    title: post.title || '',
    slug: post.slug || '',
    excerpt: post.excerpt || '',
    publishedDate: post.datePublished,
    modifiedDate: post.dateModified,
    featuredImage: post.featuredImage ? {
      url: post.featuredImage.url,
      alt: post.featuredImage.alt || post.featuredImage.filename || 'Featured image'
    } : null,
    author: post.author ? {
      name: post.author.name || '',
      bio: post.author.bio || '',
      avatar: post.author.avatar ? {
        url: post.author.avatar.url,
        alt: post.author.avatar.alt || post.author.avatar.filename || 'Author avatar'
      } : null
    } : null,
    tags: post.tags ? post.tags.map((tag: any) => tag.name) : [],
    categories: post.categories ? post.categories.map((cat: any) => cat.name) : [],
    readingTime,
    wordCount
  }
}

/**
 * Extract display data from site config for frontend rendering
 */
export function getSiteDisplayData(siteConfig: any): SiteDisplayData {
  return {
    name: siteConfig.siteName || '',
    url: siteConfig.siteUrl || '',
    description: siteConfig.siteDescription || '',
    tagline: siteConfig.siteTagline || '',
    socialMedia: siteConfig.socialMedia || {}
  }
}

/**
 * Calculate reading time based on word count and WPM
 */
export function calculateReadingTime(text: string, wordsPerMinute: number = 200): number {
  if (!text || text.trim().length === 0) {
    return 0
  }

  const wordCount = countWords(text)
  const minutes = wordCount / wordsPerMinute
  
  // Round up to at least 1 minute if there are words
  return wordCount > 0 ? Math.max(1, Math.round(minutes)) : 0
}

/**
 * Format a date for display
 */
export function formatDisplayDate(
  dateString: string, 
  format: 'short' | 'long' | 'medium' = 'long',
  locale: string = 'en-US'
): string {
  try {
    const date = new Date(dateString)
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: format === 'short' ? 'short' : 'long',
      day: 'numeric'
    }

    return date.toLocaleDateString(locale, options)
  } catch (error) {
    return 'Invalid Date'
  }
}

/**
 * Extract author information from a post
 */
export function getAuthorInfo(post: any): AuthorInfo | null {
  if (!post.author) {
    return null
  }

  return {
    name: post.author.name || '',
    bio: post.author.bio || '',
    avatar: post.author.avatar ? {
      url: post.author.avatar.url,
      alt: post.author.avatar.alt || post.author.avatar.filename || 'Author avatar'
    } : null,
    email: post.author.email
  }
}

/**
 * Generate social media share URLs
 */
export function getSocialShareUrls(
  post: any, 
  siteConfig: any, 
  customText?: string
): SocialShareUrls {
  const postUrl = `${siteConfig.siteUrl}/posts/${post.slug}`
  const shareText = customText || post.title || ''
  const encodedText = encodeURIComponent(shareText)
  const encodedUrl = encodeURIComponent(postUrl)

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedText}&body=${encodedUrl}`
  }
}

/**
 * Generate breadcrumbs for display
 */
export function generateDisplayBreadcrumbs(
  post: any, 
  siteConfig: any, 
  includeCategory: boolean = false
): DisplayBreadcrumb[] {
  const breadcrumbs: DisplayBreadcrumb[] = [
    {
      label: 'Home',
      url: siteConfig.siteUrl,
      isActive: false
    },
    {
      label: 'Posts',
      url: `${siteConfig.siteUrl}/posts`,
      isActive: false
    }
  ]

  // Add category if requested and available
  if (includeCategory && post.categories && post.categories.length > 0) {
    const category = post.categories[0]
    breadcrumbs.push({
      label: category.name,
      url: `${siteConfig.siteUrl}/categories/${category.slug}`,
      isActive: false
    })
  }

  // Add current post
  breadcrumbs.push({
    label: post.title,
    url: `${siteConfig.siteUrl}/posts/${post.slug}`,
    isActive: true
  })

  return breadcrumbs
}

/**
 * Check if a post has custom SEO settings
 */
export function hasCustomSEO(post: any): boolean {
  return !!(post.seo && (post.seo.pageTitle || post.seo.metaDescription))
}

/**
 * Get performance hints for a post
 */
export function getPerformanceHints(post: any, siteConfig: any): PerformanceHints {
  const hints: PerformanceHints = {
    preconnect: [],
    dnsPrefetch: [],
    preload: [],
    prefetch: []
  }

  // Add CDN domains to preconnect
  if (siteConfig.performanceSettings?.cdnDomains) {
    hints.preconnect.push(...siteConfig.performanceSettings.cdnDomains)
  }

  // Add analytics domains to preconnect
  if (siteConfig.performanceSettings?.analyticsDomains) {
    hints.preconnect.push(...siteConfig.performanceSettings.analyticsDomains)
  }

  // Add featured image to preload
  if (post.featuredImage?.url) {
    hints.preload.push(post.featuredImage.url)
  }

  // Add related posts or next posts to prefetch (placeholder for now)
  // This could be enhanced to include actual related content URLs
  hints.prefetch = []

  return hints
}

/**
 * Get tags from a post
 */
export function getPostTags(post: any): string[] {
  return post.tags ? post.tags.map((tag: any) => tag.name) : []
}

/**
 * Check if a post is visible (published and not draft)
 */
export function isPostVisible(post: any, isPreview: boolean = false): boolean {
  // In preview mode, show all posts regardless of status or publication date
  if (isPreview) {
    return true
  }

  // Must be published
  if (post.status !== 'published') {
    return false
  }

  // Check if publication date is in the future
  if (post.datePublished) {
    const publishDate = new Date(post.datePublished)
    const now = new Date()
    
    if (publishDate > now) {
      return false
    }
  }

  return true
}

/**
 * Get reading statistics for a post
 */
export function getReadingStats(post: any): ReadingStats {
  const content = post.content || []
  const plainText = extractPlainText(content)
  const wordCount = countWords(plainText)
  const readingTime = calculateReadingTime(plainText)
  const characterCount = plainText.length
  const paragraphCount = countParagraphs(content)

  return {
    wordCount,
    readingTime,
    characterCount,
    paragraphCount
  }
}

/**
 * Count paragraphs in rich text content
 */
function countParagraphs(content: any[]): number {
  if (!content || !Array.isArray(content)) {
    return 0
  }

  let count = 0
  
  for (const block of content) {
    if (block && typeof block === 'object') {
      if (block.type === 'paragraph') {
        count++
      } else if (block.children && Array.isArray(block.children)) {
        // Recursively count paragraphs in nested content
        count += countParagraphs(block.children)
      }
    }
  }

  return count
}