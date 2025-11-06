import type { Metadata } from 'next'

export type MediaRel = {
  id?: string | number
  url?: string
  filename?: string
}

export type Post = {
  id?: string | number
  title?: string
  slug?: string
  excerpt?: string
  publishedAt?: string | Date
  content?: { type: string; children?: any[]; [key: string]: any }[]
  featuredImage?: MediaRel | string
  socialShareImage?: MediaRel | string
  updatedAt?: string | Date

  seo?: {
    title?: string
    description?: string
    canonicalURL?: string
    robots?: {
      index?: boolean
      follow?: boolean
    }
    openGraph?: {
      title?: string
      description?: string
      type?: 'website' | 'article' | 'profile' | 'product' | 'book' | 'music.song' | 'music.album'
      url?: string
      images?: (
        | { url?: string; width?: number; height?: number; alt?: string }
        | MediaRel
        | string
      )[]
    }
    twitter?: {
      title?: string
      description?: string
      card?: 'summary' | 'summary_large_image' | 'player' | 'app'
      site?: string
      creator?: string
      images?: (MediaRel | string)[]
    }
  }

  jsonld?: {
    organization?: {
      name?: string
      url?: string
      sameAs?: string[]
    }
    article?: {
      headline?: string
      description?: string
      datePublished?: string | Date
      dateModified?: string | Date
      author?: { '@type': 'Person' | 'Organization'; name?: string; url?: string }
    }
  }
}

export type Site = {
  name: string
  url: string
  locale?: string
  twitter?: string
}

function asImageUrl(img: MediaRel | string | undefined): string | undefined {
  if (!img) return undefined
  if (typeof img === 'string') return img
  return img.url || undefined
}

export function buildMetadata(post: Post, site: Site): Metadata {
  const title = post.seo?.title || post.title || site.name
  const description = post.seo?.description || post.excerpt || undefined
  const canonical = post.seo?.canonicalURL || `${site.url}/posts/${post.slug}`

  const ogImageCandidates = (post.seo?.openGraph?.images || []).map(asImageUrl)
  const twitterImageCandidates = (post.seo?.twitter?.images || []).map(asImageUrl)
  const featured = asImageUrl(post.featuredImage)
  const share = asImageUrl(post.socialShareImage)

  const ogImages = ([
    ...(ogImageCandidates.filter(Boolean) as string[]),
    share,
    featured,
  ].filter(Boolean) as string[])

  const twitterImages = ([
    ...(twitterImageCandidates.filter(Boolean) as string[]),
    share,
    featured,
  ].filter(Boolean) as string[])

  const publishedTime = post.publishedAt
    ? typeof post.publishedAt === 'string'
      ? post.publishedAt
      : post.publishedAt.toISOString()
    : undefined

  const updatedTime = post.updatedAt
    ? typeof post.updatedAt === 'string'
      ? post.updatedAt
      : post.updatedAt.toISOString()
    : undefined

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: post.seo?.robots?.index ?? true,
      follow: post.seo?.robots?.follow ?? true,
    },
    openGraph: {
      title,
      description,
      type: (post.seo?.openGraph?.type as any) || 'article',
      url: post.seo?.openGraph?.url || canonical,
      locale: site.locale || 'en_ZA',
      siteName: site.name,
      images: ogImages.length
        ? ogImages.map((url) => ({ url }))
        : undefined,
      publishedTime,
      modifiedTime: updatedTime,
    },
    twitter: {
      card: post.seo?.twitter?.card || 'summary_large_image',
      title,
      description,
      site: site.twitter,
      creator: site.twitter,
      images: twitterImages.length ? twitterImages : undefined,
    },
  }
}

export function buildJsonLd(post: Post, site: Site) {
  const canonical = post.seo?.canonicalURL || `${site.url}/posts/${post.slug}`
  const publishedTime = post.publishedAt
    ? typeof post.publishedAt === 'string'
      ? post.publishedAt
      : post.publishedAt.toISOString()
    : undefined
  const updatedTime = post.updatedAt
    ? typeof post.updatedAt === 'string'
      ? post.updatedAt
      : post.updatedAt.toISOString()
    : undefined

  const graph: any[] = []

  // Organization
  graph.push({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: post.jsonld?.organization?.name || site.name,
    url: post.jsonld?.organization?.url || site.url,
    sameAs: post.jsonld?.organization?.sameAs,
  })

  // WebSite
  graph.push({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: site.url,
    name: site.name,
  })

  // WebPage
  graph.push({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: canonical,
  })

  // Article
  graph.push({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.jsonld?.article?.headline || post.title,
    description: post.jsonld?.article?.description || post.excerpt,
    datePublished: post.jsonld?.article?.datePublished || publishedTime,
    dateModified: post.jsonld?.article?.dateModified || updatedTime,
    author: post.jsonld?.article?.author || {
      '@type': 'Organization',
      name: site.name,
      url: site.url,
    },
    mainEntityOfPage: canonical,
  })

  return graph
}