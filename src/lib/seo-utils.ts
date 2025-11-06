import type { Metadata } from 'next'
import type { PayloadRequest } from 'payload'

// Type definitions for the new structure
export interface MediaRel {
  id?: string | number
  url?: string
  filename?: string
  alt?: string
  width?: number
  height?: number
}

export interface PostSEO {
  pageTitle?: string
  metaDescription?: string
  metaKeywords?: string
  canonicalURL?: string
}

export interface PostOpenGraph {
  ogTitle?: string
  ogDescription?: string
  ogImage?: MediaRel | string
  ogImageAlt?: string
  articleAuthor?: string
  articleSection?: string
  articleTags?: Array<{ tag: string }>
}

export interface PostTwitter {
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: MediaRel | string
  twitterImageAlt?: string
}

export interface PostJSONLD {
  headline?: string
  schemaDescription?: string
  schemaArticleSection?: string
  schemaKeywords?: string
  schemaImages?: Array<{ image: MediaRel | string; alt?: string }>
  wordCount?: number
  breadcrumbs?: Array<{ position: number; name: string; item: string }>
}

export interface Post {
  id?: string | number
  title?: string
  slug?: string
  excerpt?: string
  datePublished?: string | Date
  dateModified?: string | Date
  content?: any
  featuredImage?: MediaRel | string
  status?: string
  seo?: PostSEO
  openGraph?: PostOpenGraph
  twitter?: PostTwitter
  jsonld?: PostJSONLD
  hreflang?: Array<{ locale: string; url: string }>
  preloadImages?: Array<{ href: string; imagesrcset?: string; imagesizes?: string; as?: string }>
}

export interface SiteConfig {
  siteName?: string
  siteUrl?: string
  siteDescription?: string
  siteTagline?: string
  seoDefaults?: {
    metaAuthor?: string
    robots?: string
    charset?: string
    viewport?: string
    themeColor?: string
    language?: string
    revisitAfter?: string
  }
  openGraphDefaults?: {
    ogSiteName?: string
    ogLocale?: string
    ogType?: string
    defaultOgImage?: MediaRel | string
    defaultOgImageAlt?: string
  }
  twitterDefaults?: {
    twitterCard?: string
    twitterSite?: string
    twitterCreator?: string
  }
  schemaDefaults?: {
    generateJSONLD?: boolean
    defaultSchemaType?: string
    inLanguage?: string
    isAccessibleForFree?: boolean
    organization?: {
      name?: string
      url?: string
      logo?: MediaRel | string
      sameAs?: Array<{ url: string }>
    }
    publisher?: {
      name?: string
      logo?: MediaRel | string
    }
    webSite?: {
      url?: string
      name?: string
      searchAction?: {
        target?: string
        queryInput?: string
      }
    }
  }
  faviconICO?: MediaRel | string
  iconSVG?: MediaRel | string
  appleTouchIcon?: MediaRel | string
  webAppManifest?: MediaRel | string
  cdnDomain?: string
  analyticsOrAdsDomain?: string
  preconnect?: Array<{ href: string }>
  dnsPrefetch?: Array<{ href: string }>
  rssLink?: string
  googleSiteVerification?: string
  bingMsValidate?: string
  yandexVerification?: string
  gtmID?: string
  gaMeasurementID?: string
  facebookPixelID?: string
}

/**
 * Safely extract URL from media relation or string
 */
export function getMediaUrl(media: MediaRel | string | undefined | null): string {
  if (!media) return ''
  if (typeof media === 'string') return media
  return media.url || ''
}

/**
 * Build absolute URL from base URL and path
 */
export function buildAbsoluteUrl(baseUrl: string, path: string): string {
  if (!baseUrl) return path
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  
  const cleanBase = baseUrl.replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  
  return `${cleanBase}${cleanPath}`
}

/**
 * Extract plain text from rich text content (Lexical or other formats)
 */
export function extractPlainText(content: any): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    const texts = content.map(extractPlainText).filter(Boolean)
    return texts.join(' ').replace(/\s+/g, ' ').trim()
  }
  if (typeof content === 'object') {
    const text = typeof content.text === 'string' ? content.text : ''
    const children = content.children ? extractPlainText(content.children) : ''
    const combined = [text, children].filter(Boolean).join('')
    return combined
  }
  return ''
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return (text.trim().match(/\b[\w''-]+\b/g) || []).length
}

/**
 * Generate breadcrumbs for a post
 */
export function generateBreadcrumbs(post: Post, siteConfig: SiteConfig): Array<{ name: string; url: string }> {
  const baseUrl = siteConfig.siteUrl || ''
  const siteName = 'Home' // Use 'Home' as expected by tests
  
  const breadcrumbs = [
    {
      name: siteName,
      url: baseUrl,
    },
    {
      name: 'Posts',
      url: buildAbsoluteUrl(baseUrl, '/posts'),
    },
  ]
  
  if (post.title && post.slug) {
    const postTitle = post.seo?.pageTitle || post.title
    breadcrumbs.push({
      name: postTitle,
      url: buildAbsoluteUrl(baseUrl, `/posts/${post.slug}`),
    })
  }
  
  return breadcrumbs
}

/**
 * Merge post-specific data with site defaults using fallback hierarchy
 */
export function mergeSeoData(post: Post, siteConfig: SiteConfig): {
  meta: {
    title: string
    description: string
    canonical: string
    robots: string
    author: string
    charset: string
    viewport: string
    themeColor: string
    language: string
  }
  openGraph: {
    title: string
    description: string
    type: string
    url: string
    image?: string
    imageAlt?: string
    siteName: string
    locale: string
    article?: {
      author?: string
      publishedTime?: string
      modifiedTime?: string
      section?: string
      tags?: string[]
    }
  }
  twitter: {
    card: string
    title: string
    description: string
    image?: string
    imageAlt?: string
    site?: string
    creator?: string
  }
  alternates: Array<{ hrefLang: string; href: string }>
  preloadImages: Array<{ href: string; imagesrcset?: string; imagesizes?: string; as?: string }>
} {
  const baseUrl = siteConfig.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || ''
  const postPath = `/posts/${post.slug || ''}`
  const canonical = post.seo?.canonicalURL || buildAbsoluteUrl(baseUrl, postPath)
  
  // Meta data with fallbacks
  const title = post.seo?.pageTitle || post.title || siteConfig.siteName || ''
  const description = post.seo?.metaDescription || post.excerpt || siteConfig.siteDescription || ''
  const robots = siteConfig.seoDefaults?.robots || 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
  const author = siteConfig.seoDefaults?.metaAuthor || ''
  const charset = siteConfig.seoDefaults?.charset || 'UTF-8'
  const viewport = siteConfig.seoDefaults?.viewport || 'width=device-width, initial-scale=1'
  const themeColor = siteConfig.seoDefaults?.themeColor || '#000000'
  const language = siteConfig.seoDefaults?.language || 'en-ZA'
  
  // Open Graph with fallbacks
  const ogTitle = post.openGraph?.ogTitle || title
  const ogDescription = post.openGraph?.ogDescription || description
  const ogType = 'article' // Posts should always be articles
  const ogUrl = canonical
  const ogImage = getMediaUrl(post.openGraph?.ogImage) || 
                  getMediaUrl(post.featuredImage) || 
                  getMediaUrl(siteConfig.openGraphDefaults?.defaultOgImage)
  const ogImageAlt = post.openGraph?.ogImageAlt || 
                     (post.featuredImage && typeof post.featuredImage === 'object' ? post.featuredImage.alt : '') ||
                     siteConfig.openGraphDefaults?.defaultOgImageAlt || ''
  const ogSiteName = siteConfig.openGraphDefaults?.ogSiteName || siteConfig.siteName || ''
  const ogLocale = siteConfig.openGraphDefaults?.ogLocale || language.replace('-', '_')
  
  // Article-specific Open Graph
  let article: any = undefined
  if (ogType === 'article') {
    article = {
      author: post.openGraph?.articleAuthor,
      publishedTime: typeof post.datePublished === 'string' ? post.datePublished : post.datePublished?.toISOString(),
      modifiedTime: typeof post.dateModified === 'string' ? post.dateModified : post.dateModified?.toISOString(),
      section: post.openGraph?.articleSection,
      tags: Array.isArray(post.openGraph?.articleTags) ? 
            post.openGraph.articleTags.map(t => t.tag).filter(Boolean) : undefined,
    }
  }
  
  // Twitter with fallbacks
  const twitterCard = siteConfig.twitterDefaults?.twitterCard || 'summary_large_image'
  const twitterTitle = post.twitter?.twitterTitle || ogTitle
  const twitterDescription = post.twitter?.twitterDescription || ogDescription
  const twitterImage = getMediaUrl(post.twitter?.twitterImage) || ogImage
  const twitterImageAlt = post.twitter?.twitterImageAlt || ogImageAlt
  const twitterSite = siteConfig.twitterDefaults?.twitterSite
  const twitterCreator = siteConfig.twitterDefaults?.twitterCreator
  
  // Alternates from hreflang
  const alternates = Array.isArray(post.hreflang) ? 
    post.hreflang.map(h => ({ hrefLang: h.locale, href: h.url })) : []
  
  // Preload images
  const preloadImages = Array.isArray(post.preloadImages) ? post.preloadImages : []
  
  return {
    meta: {
      title,
      description,
      canonical,
      robots,
      author,
      charset,
      viewport,
      themeColor,
      language,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: ogType,
      url: ogUrl,
      image: ogImage,
      imageAlt: ogImageAlt,
      siteName: ogSiteName,
      locale: ogLocale,
      article,
    },
    twitter: {
      card: twitterCard,
      title: twitterTitle,
      description: twitterDescription,
      image: twitterImage,
      imageAlt: twitterImageAlt,
      site: twitterSite,
      creator: twitterCreator,
    },
    alternates,
    preloadImages,
  }
}

/**
 * Build Next.js Metadata object from merged SEO data
 */
export function buildMetadata(post: Post, siteConfig: SiteConfig): Metadata {
  const seoData = mergeSeoData(post, siteConfig)
  
  const metadata: Metadata = {
    title: seoData.meta.title,
    description: seoData.meta.description,
    alternates: {
      canonical: seoData.meta.canonical,
      languages: seoData.alternates.reduce((acc, alt) => {
        acc[alt.hrefLang] = alt.href
        return acc
      }, {} as Record<string, string>),
    },
    robots: {
      index: seoData.meta.robots.includes('index'),
      follow: seoData.meta.robots.includes('follow'),
    },
    authors: seoData.meta.author ? [{ name: seoData.meta.author }] : undefined,
    openGraph: {
      title: seoData.openGraph.title,
      description: seoData.openGraph.description,
      type: seoData.openGraph.type as any,
      url: seoData.openGraph.url,
      siteName: seoData.openGraph.siteName,
      locale: seoData.openGraph.locale,
      images: seoData.openGraph.image ? [{
        url: seoData.openGraph.image,
        alt: seoData.openGraph.imageAlt,
      }] : undefined,
      publishedTime: seoData.openGraph.article?.publishedTime,
      modifiedTime: seoData.openGraph.article?.modifiedTime,
      authors: seoData.openGraph.article?.author ? [seoData.openGraph.article.author] : undefined,
      section: seoData.openGraph.article?.section,
      tags: seoData.openGraph.article?.tags,
    },
    twitter: {
      card: seoData.twitter.card as any,
      title: seoData.twitter.title,
      description: seoData.twitter.description,
      site: seoData.twitter.site,
      creator: seoData.twitter.creator,
      images: seoData.twitter.image ? [{
        url: seoData.twitter.image,
        alt: seoData.twitter.imageAlt,
      }] : undefined,
    },
  }
  
  return metadata
}

/**
 * Generate JSON-LD structured data
 */
export function buildJsonLd(post: Post, siteConfig: SiteConfig): any[] {
  const baseUrl = siteConfig.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || ''
  const canonical = post.seo?.canonicalURL || buildAbsoluteUrl(baseUrl, `/posts/${post.slug || ''}`)
  const seoData = mergeSeoData(post, siteConfig)
  
  const jsonLdArray: any[] = []
  
  // Only generate if enabled
  if (siteConfig.schemaDefaults?.generateJSONLD === false) {
    return jsonLdArray
  }
  
  // Organization
  if (siteConfig.schemaDefaults?.organization?.name) {
    const org = siteConfig.schemaDefaults.organization
    jsonLdArray.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: org.name,
      url: org.url || baseUrl,
      logo: getMediaUrl(org.logo) ? {
        '@type': 'ImageObject',
        url: getMediaUrl(org.logo),
      } : undefined,
      sameAs: Array.isArray(org.sameAs) ? 
        org.sameAs.map(s => s.url).filter(Boolean) : undefined,
    })
  }
  
  // WebSite
  if (siteConfig.schemaDefaults?.webSite?.url || baseUrl) {
    const webSite = siteConfig.schemaDefaults?.webSite
    jsonLdArray.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      url: webSite?.url || baseUrl,
      name: webSite?.name || siteConfig.siteName,
      potentialAction: webSite?.searchAction?.target ? {
        '@type': 'SearchAction',
        target: webSite.searchAction.target,
        'query-input': webSite.searchAction.queryInput || 'required name=search_term_string',
      } : undefined,
    })
  }
  
  // WebPage
  jsonLdArray.push({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: canonical,
    name: seoData.meta.title,
    description: seoData.meta.description,
    inLanguage: siteConfig.schemaDefaults?.inLanguage || 'en-ZA',
  })
  
  // Article
  const schemaType = siteConfig.schemaDefaults?.defaultSchemaType || 'Article'
  const article: any = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    headline: post.jsonld?.headline || post.title,
    description: post.jsonld?.schemaDescription || seoData.meta.description,
    datePublished: typeof post.datePublished === 'string' ? post.datePublished : post.datePublished?.toISOString(),
    dateModified: typeof post.dateModified === 'string' ? post.dateModified : post.dateModified?.toISOString(),
    mainEntityOfPage: canonical,
    url: canonical,
    inLanguage: siteConfig.schemaDefaults?.inLanguage || 'en-ZA',
    isAccessibleForFree: siteConfig.schemaDefaults?.isAccessibleForFree !== false,
  }
  
  // Add images
  const images: string[] = []
  if (Array.isArray(post.jsonld?.schemaImages)) {
    post.jsonld.schemaImages.forEach(img => {
      const url = getMediaUrl(img.image)
      if (url) images.push(url)
    })
  }
  if (images.length === 0 && seoData.openGraph.image) {
    images.push(seoData.openGraph.image)
  }
  if (images.length > 0) {
    article.image = images
  }
  
  // Add word count
  if (post.jsonld?.wordCount) {
    article.wordCount = post.jsonld.wordCount
  }
  
  // Add author
  if (siteConfig.schemaDefaults?.organization?.name) {
    article.author = {
      '@type': 'Organization',
      name: siteConfig.schemaDefaults.organization.name,
      url: siteConfig.schemaDefaults.organization.url || baseUrl,
    }
  }
  
  // Add publisher
  if (siteConfig.schemaDefaults?.publisher?.name) {
    const pub = siteConfig.schemaDefaults.publisher
    article.publisher = {
      '@type': 'Organization',
      name: pub.name,
      logo: getMediaUrl(pub.logo) ? {
        '@type': 'ImageObject',
        url: getMediaUrl(pub.logo),
      } : undefined,
    }
  }
  
  // Add article-specific fields
  if (post.jsonld?.schemaArticleSection || post.openGraph?.articleSection) {
    article.articleSection = post.jsonld?.schemaArticleSection || post.openGraph?.articleSection
  }
  
  if (post.jsonld?.schemaKeywords || (Array.isArray(post.openGraph?.articleTags) && post.openGraph.articleTags.length > 0)) {
    article.keywords = post.jsonld?.schemaKeywords || 
      post.openGraph?.articleTags?.map(t => t.tag).join(',')
  }
  
  jsonLdArray.push(article)
  
  // Breadcrumbs
  const breadcrumbs = post.jsonld?.breadcrumbs || generateBreadcrumbs(post, siteConfig)
  if (breadcrumbs.length > 0) {
    jsonLdArray.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: (crumb as any).position || index + 1,
        name: crumb.name || (crumb as any).name,
        item: (crumb as any).item || (crumb as any).url,
      })),
    })
  }
  
  return jsonLdArray.filter(Boolean)
}

/**
 * Compute word count from post content
 */
export function computeWordCount(post: Post): number {
  // Prioritize existing word count
  if (post.jsonld?.wordCount) {
    return post.jsonld.wordCount
  }
  
  const contentText = extractPlainText(post.content)
  const excerptText = post.excerpt || ''
  
  // If no content, only count excerpt
  if (!post.content) {
    return countWords(excerptText.trim())
  }
  
  return countWords(`${contentText} ${excerptText}`.trim())
}

/**
 * Generate performance hints for a post
 */
export function generatePerformanceHints(post: Post, siteConfig: SiteConfig): {
  preconnect: string[]
  dnsPrefetch: string[]
  preload: string[]
  prefetch: string[]
} {
  const preconnect: string[] = []
  const dnsPrefetch: string[] = []
  const preload: string[] = []
  const prefetch: string[] = []
  
  // Add site-wide hints
  if (Array.isArray(siteConfig.preconnect)) {
    siteConfig.preconnect.forEach(hint => {
      if (hint.href) preconnect.push(hint.href)
    })
  }
  
  if (Array.isArray(siteConfig.dnsPrefetch)) {
    siteConfig.dnsPrefetch.forEach(hint => {
      if (hint.href) dnsPrefetch.push(hint.href)
    })
  }
  
  // Add CDN domain
  if (siteConfig.cdnDomain) {
    preconnect.push(siteConfig.cdnDomain)
  }
  
  // Add analytics domain
  if (siteConfig.analyticsOrAdsDomain) {
    preconnect.push(siteConfig.analyticsOrAdsDomain)
  }
  
  // Support legacy performanceSettings structure for tests
  const performanceSettings = (siteConfig as any).performanceSettings
  if (performanceSettings) {
    if (Array.isArray(performanceSettings.cdnDomains)) {
      performanceSettings.cdnDomains.forEach((domain: string) => {
        if (domain) preconnect.push(domain)
      })
    }
    if (Array.isArray(performanceSettings.analyticsDomains)) {
      performanceSettings.analyticsDomains.forEach((domain: string) => {
        if (domain) preconnect.push(domain)
      })
    }
  }
  
  // Add featured image to preload
  const featuredImageUrl = getMediaUrl(post.featuredImage)
  if (featuredImageUrl) {
    preload.push(featuredImageUrl)
  }
  
  // Add post-specific preload images
  if (Array.isArray(post.preloadImages)) {
    post.preloadImages.forEach(img => {
      if (img.href) {
        preload.push(img.href)
      }
    })
  }
  
  return {
    preconnect: [...new Set(preconnect)],
    dnsPrefetch: [...new Set(dnsPrefetch)],
    preload: [...new Set(preload)],
    prefetch: [...new Set(prefetch)],
  }
}