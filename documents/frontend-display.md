Awesome—here’s a **Next.js App Router** setup that reads your Payload `posts` schema and outputs:

- `<title>`, meta description, robots, canonical, hreflang
- Open Graph, Twitter
- Favicons/app icons, theme-color
- Verification, RSS/AMP, pagination
- JSON-LD graph (Article, Breadcrumb, Org, WebSite, WebPage)
- Performance hints (preconnect / dns-prefetch / preload)

### 1) `lib/seo.ts` — helpers to map a Post to Metadata + JSON-LD

```ts
// lib/seo.ts
import type { Metadata } from 'next'

export type MediaRel = { id: string | number; url?: string; filename?: string }
export type Hreflang = { locale: string; url: string }

export type Post = {
  title: string
  slug: string
  excerpt?: string
  featuredImage?: MediaRel | string | number

  datePublished?: string
  dateModified?: string
  status?: 'draft' | 'published'

  // tabs: Core Meta
  seo?: {
    pageTitle?: string
    metaDescription?: string
    metaKeywords?: string
    metaAuthor?: string
    robots?: string
    canonicalURL?: string
    charset?: string
    viewport?: string
    themeColor?: string
    language?: string
    revisitAfter?: string
    openGraph?: any // normalized below
  }

  // tabs: OG
  openGraph?: {
    ogTitle?: string
    ogDescription?: string
    ogType?: 'article' | 'website' | 'profile' | 'video.other'
    ogURL?: string
    ogImage?: MediaRel | string | number
    ogImageAlt?: string
    ogSiteName?: string
    ogLocale?: string
    articleAuthor?: string
    articlePublishedTime?: string
    articleModifiedTime?: string
    articleSection?: string
    articleTags?: { tag: string }[]
  }

  // tabs: Twitter
  twitter?: {
    twitterCard?: 'summary_large_image' | 'summary'
    twitterTitle?: string
    twitterDescription?: string
    twitterImage?: MediaRel | string | number
    twitterImageAlt?: string
    twitterSite?: string
    twitterCreator?: string
  }

  // tabs: JSON-LD
  jsonld?: {
    generateJSONLD?: boolean
    schemaType?: 'Article' | 'BlogPosting' | 'NewsArticle'
    headline?: string
    schemaDescription?: string
    schemaArticleSection?: string
    schemaKeywords?: string
    inLanguage?: string
    isAccessibleForFree?: boolean
    schemaImages?: { image: MediaRel | string | number; alt?: string }[]
    schemaAuthor?: { name?: string; url?: string; sameAs?: { url: string }[] }
    schemaPublisher?: { name?: string; logo?: MediaRel | string | number }
    wordCount?: number
    schemaURL?: string
    mainEntityOfPage?: string
    breadcrumbs?: { position: number; name: string; item: string }[]
    organization?: {
      name?: string
      url?: string
      logo?: MediaRel | string | number
      sameAs?: { url: string }[]
    }
    webSite?: {
      url?: string
      name?: string
      searchAction?: { target?: string; queryInput?: string }
    }
    webPage?: { url?: string; name?: string; inLanguage?: string; description?: string }
  }

  // i18n
  hreflang?: Hreflang[]

  // icons & app
  faviconICO?: MediaRel | string | number
  iconSVG?: MediaRel | string | number
  appleTouchIcon?: MediaRel | string | number
  webAppManifest?: MediaRel | string | number

  // performance
  cdnDomain?: string
  analyticsOrAdsDomain?: string
  preconnect?: { href: string }[]
  dnsPrefetch?: { href: string }[]
  preloadImages?: { href: string; imagesrcset?: string; imagesizes?: string; as?: string }[]

  // feeds & amp
  rssLink?: string
  amphtmlLink?: string

  // verification
  googleSiteVerification?: string
  bingMsValidate?: string
  yandexVerification?: string

  // pagination
  prevURL?: string
  nextURL?: string
}

export type Site = {
  name: string
  url: string // e.g. https://webdevelopment.org.za
  defaultLocale?: string // en-ZA
  twitter?: string // @site
  logoUrl?: string // absolute URL for publisher.logo
  icons?: {
    favicon?: string
    icon?: string
    apple?: string
    manifest?: string
  }
}

/** Normalize a media relation to absolute URL */
export const mediaToUrl = (m?: MediaRel | string | number, site?: Site) => {
  if (!m) return undefined
  if (typeof m === 'string') return absoluteUrl(m, site)
  if (typeof m === 'number') return undefined
  if (m.url) return absoluteUrl(m.url, site)
  if (m.filename) return absoluteUrl(`/${m.filename}`, site)
  return undefined
}

export const absoluteUrl = (url?: string, site?: Site) => {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  if (!site?.url) return url
  return `${site.url.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`
}

export const canonicalOf = (post: Post, site: Site) =>
  post.seo?.canonicalURL
    ? absoluteUrl(post.seo.canonicalURL, site)
    : `${site.url.replace(/\/+$/, '')}/posts/${post.slug}`

/** Build Next.js Metadata from a post */
export function buildMetadata(post: Post, site: Site): Metadata {
  const title = post.seo?.pageTitle || post.title
  const description = post.seo?.metaDescription || post.excerpt || undefined
  const canonical = canonicalOf(post, site)

  // Images (fallback chain)
  const ogImg =
    mediaToUrl(post.openGraph?.ogImage, site) ||
    mediaToUrl(post.twitter?.twitterImage, site) ||
    mediaToUrl(post.featuredImage, site)

  const themeColor = post.seo?.themeColor || '#000000'
  const robots =
    post.seo?.robots || 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'

  const keywords = post.seo?.metaKeywords
    ? post.seo.metaKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
    : undefined

  // Open Graph meta
  const og: Metadata['openGraph'] = {
    type: post.openGraph?.ogType || 'article',
    title: post.openGraph?.ogTitle || title,
    description: post.openGraph?.ogDescription || description,
    url: post.openGraph?.ogURL || canonical,
    siteName: post.openGraph?.ogSiteName || site.name,
    locale: post.openGraph?.ogLocale || post.seo?.language?.replace('-', '_') || 'en_ZA',
    images: ogImg ? [{ url: ogImg, alt: post.openGraph?.ogImageAlt || title }] : undefined,
  }

  // Twitter meta
  const twitter: Metadata['twitter'] = {
    card: post.twitter?.twitterCard || 'summary_large_image',
    title: post.twitter?.twitterTitle || title,
    description: post.twitter?.twitterDescription || description,
    site: post.twitter?.twitterSite || site.twitter,
    creator: post.twitter?.twitterCreator,
    images: ogImg ? [ogImg] : undefined,
  }

  // Hreflang
  const alternates: Metadata['alternates'] = {
    canonical,
    languages: post.hreflang?.length
      ? Object.fromEntries(post.hreflang.map((h) => [h.locale, absoluteUrl(h.url, site)!]))
      : undefined,
  }

  // Icons (prefer post-specific overrides, else site defaults)
  const icons: Metadata['icons'] = {
    icon:
      mediaToUrl(post.iconSVG, site) ||
      site.icons?.icon ||
      mediaToUrl(post.faviconICO, site) ||
      site.icons?.favicon,
    apple: mediaToUrl(post.appleTouchIcon, site) || site.icons?.apple,
  }

  return {
    title,
    description,
    keywords,
    robots,
    themeColor,
    icons,
    alternates,
    openGraph: og,
    twitter,
    other: {
      'revisit-after': post.seo?.revisitAfter || '7 days',
      author: post.seo?.metaAuthor || '',
      'x-ua-compatible': 'IE=edge',
      // verifications:
      'google-site-verification': post.googleSiteVerification || '',
      'msvalidate.01': post.bingMsValidate || '',
      'yandex-verification': post.yandexVerification || '',
      // pagination:
      ...(post.prevURL ? { 'link:prev': absoluteUrl(post.prevURL, site) } : {}),
      ...(post.nextURL ? { 'link:next': absoluteUrl(post.nextURL, site) } : {}),
      // feeds / amp
      ...(post.rssLink ? { 'link:rss': absoluteUrl(post.rssLink, site) } : {}),
      ...(post.amphtmlLink ? { 'link:amphtml': absoluteUrl(post.amphtmlLink, site) } : {}),
    },
  }
}

/** Build JSON-LD @graph for Article, BreadcrumbList, Organization, WebSite, WebPage */
export function buildJsonLd(post: Post, site: Site) {
  const canonical = canonicalOf(post, site)
  const imgCandidates: string[] = []
  const add = (x?: string) => x && imgCandidates.push(x)
  add(mediaToUrl(post.openGraph?.ogImage, site))
  add(mediaToUrl(post.twitter?.twitterImage, site))
  add(mediaToUrl(post.featuredImage, site))
  const images = (
    post.jsonld?.schemaImages?.map((i) => mediaToUrl(i.image, site)!).filter(Boolean) || []
  )
    .concat(imgCandidates.filter(Boolean))
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i) // dedupe

  const articleType = post.jsonld?.schemaType || 'Article'
  const language = post.jsonld?.inLanguage || post.seo?.language || 'en-ZA'
  const published = post.datePublished || post.openGraph?.articlePublishedTime
  const modified = post.dateModified || post.openGraph?.articleModifiedTime || published
  const headline = post.jsonld?.headline || post.seo?.pageTitle || post.title
  const description = post.jsonld?.schemaDescription || post.seo?.metaDescription || post.excerpt

  const orgLogo = mediaToUrl(post.jsonld?.schemaPublisher?.logo, site) || site.logoUrl

  const organization = {
    '@type': 'Organization',
    '@id': `${site.url}#organization`,
    name: post.jsonld?.organization?.name || site.name,
    url: post.jsonld?.organization?.url || site.url,
    ...(orgLogo ? { logo: { '@type': 'ImageObject', url: orgLogo } } : {}),
    ...(post.jsonld?.organization?.sameAs?.length
      ? { sameAs: post.jsonld.organization.sameAs.map((s) => s.url) }
      : {}),
  }

  const website = {
    '@type': 'WebSite',
    '@id': `${site.url}#website`,
    url: site.url,
    name: site.name,
    ...(post.jsonld?.webSite?.searchAction?.target
      ? {
          potentialAction: {
            '@type': 'SearchAction',
            target: post.jsonld.webSite.searchAction.target,
            'query-input':
              post.jsonld.webSite.searchAction.queryInput || 'required name=search_term_string',
          },
        }
      : {}),
  }

  const webpage = {
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: post.jsonld?.webPage?.name || headline,
    isPartOf: { '@id': `${site.url}#website` },
    inLanguage: post.jsonld?.webPage?.inLanguage || language,
    datePublished: published,
    dateModified: modified,
    breadcrumb: { '@id': `${canonical}#breadcrumbs` },
    ...(description ? { description } : {}),
  }

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumbs`,
    itemListElement: post.jsonld?.breadcrumbs?.length
      ? post.jsonld.breadcrumbs
          .sort((a, b) => a.position - b.position)
          .map((c) => ({
            '@type': 'ListItem',
            position: c.position,
            name: c.name,
            item: c.item,
          }))
      : [
          { '@type': 'ListItem', position: 1, name: 'Home', item: site.url },
          { '@type': 'ListItem', position: 2, name: 'Posts', item: `${site.url}/posts` },
          { '@type': 'ListItem', position: 3, name: headline, item: canonical },
        ],
  }

  const article: any = {
    '@type': [articleType, 'BlogPosting'],
    '@id': `${canonical}#article`,
    mainEntityOfPage: { '@id': `${canonical}#webpage` },
    headline,
    ...(description ? { description } : {}),
    ...(post.jsonld?.schemaArticleSection
      ? { articleSection: post.jsonld.schemaArticleSection }
      : {}),
    ...(post.jsonld?.schemaKeywords ? { keywords: post.jsonld.schemaKeywords } : {}),
    inLanguage: language,
    isAccessibleForFree: post.jsonld?.isAccessibleForFree ?? true,
    ...(images.length ? { image: images } : {}),
    ...(post.jsonld?.schemaAuthor?.name || post.seo?.metaAuthor
      ? {
          author: {
            '@type': 'Person',
            name: post.jsonld?.schemaAuthor?.name || post.seo?.metaAuthor,
            ...(post.jsonld?.schemaAuthor?.url ? { url: post.jsonld.schemaAuthor.url } : {}),
            ...(post.jsonld?.schemaAuthor?.sameAs?.length
              ? { sameAs: post.jsonld.schemaAuthor.sameAs.map((s) => s.url) }
              : {}),
          },
        }
      : {}),
    publisher: {
      '@type': 'Organization',
      name: post.jsonld?.schemaPublisher?.name || site.name,
      ...(orgLogo ? { logo: { '@type': 'ImageObject', url: orgLogo } } : {}),
    },
    datePublished: published,
    dateModified: modified,
    ...(typeof post.jsonld?.wordCount === 'number' ? { wordCount: post.jsonld.wordCount } : {}),
    url: canonical,
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [article, breadcrumb, organization, website, webpage],
  }
}
```

---

### 2) `app/(site)/posts/[slug]/page.tsx` — usage with `generateMetadata`

```ts
// app/(site)/posts/[slug]/page.tsx
import { buildJsonLd, buildMetadata, type Post, type Site } from '@/lib/seo'
import type { Metadata } from 'next'

// ---- fetch from Payload (server) ------------------------------------------
// Replace with your actual Payload fetching util.
async function getPost(slug: string): Promise<Post | null> {
  // e.g. fetch(`${process.env.NEXT_PUBLIC_CMS_URL}/api/posts?where[slug][equals]=${slug}`)
  //      .then(r => r.json()).then(d => d.docs?.[0])
  return null
}

const SITE: Site = {
  name: 'Web Development SA',
  url: 'https://webdevelopment.org.za',
  defaultLocale: 'en-ZA',
  twitter: '@YourSite',
  logoUrl: 'https://webdevelopment.org.za/logos/publisher-logo.png',
  icons: {
    favicon: 'https://webdevelopment.org.za/icons/favicon.ico',
    icon: 'https://webdevelopment.org.za/icons/icon.svg',
    apple: 'https://webdevelopment.org.za/icons/apple-touch-icon.png',
    manifest: 'https://webdevelopment.org.za/site.webmanifest',
  },
}

// Next.js App Router metadata
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return { title: 'Not found' }
  return buildMetadata(post, SITE)
}

// JSON-LD & “extra” tags not covered by Metadata
function ArticleSEO({ post }: { post: Post }) {
  const graph = buildJsonLd(post, SITE)
  const canonical = (post.seo?.canonicalURL) || `${SITE.url}/posts/${post.slug}`

  return (
    <>
      {/* canonical (Metadata handles this too via alternates.canonical) */}
      <link rel="canonical" href={canonical} />

      {/* hreflang */}
      {post.hreflang?.map(h => (
        <link key={h.locale} rel="alternate" hrefLang={h.locale} href={h.url} />
      ))}

      {/* icons & manifest (can also be global in root layout) */}
      {SITE.icons?.manifest && <link rel="manifest" href={SITE.icons.manifest} />}

      {/* verification */}
      {post.googleSiteVerification && (
        <meta name="google-site-verification" content={post.googleSiteVerification} />
      )}
      {post.bingMsValidate && <meta name="msvalidate.01" content={post.bingMsValidate} />}
      {post.yandexVerification && (
        <meta name="yandex-verification" content={post.yandexVerification} />
      )}

      {/* feeds / amp */}
      {post.rssLink && <link rel="alternate" type="application/rss+xml" href={post.rssLink} />}
      {post.amphtmlLink && <link rel="amphtml" href={post.amphtmlLink} />}

      {/* pagination */}
      {post.prevURL && <link rel="prev" href={post.prevURL} />}
      {post.nextURL && <link rel="next" href={post.nextURL} />}

      {/* performance hints */}
      {post.cdnDomain && <link rel="preconnect" href={`https://${post.cdnDomain}`} crossOrigin="" />}
      {post.analyticsOrAdsDomain && <link rel="dns-prefetch" href={`//${post.analyticsOrAdsDomain}`} />}
      {post.preconnect?.map((p, i) => (
        <link key={`pc-${i}`} rel="preconnect" href={p.href} crossOrigin="" />
      ))}
      {post.dnsPrefetch?.map((p, i) => (
        <link key={`dp-${i}`} rel="dns-prefetch" href={p.href} />
      ))}
      {post.preloadImages?.map((p, i) => (
        <link
          key={`pl-${i}`}
          rel="preload"
          as={p.as || 'image'}
          href={p.href}
          {...(p.imagesrcset ? { imagesrcset: p.imagesrcset } : {})}
          {...(p.imagesizes ? { imagesizes: p.imagesizes } : {})}
        />
      ))}

      {/* JSON-LD */}
      {post.jsonld?.generateJSONLD !== false && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
        />
      )}
    </>
  )
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  if (!post) return <div className="prose mx-auto py-10">Not found</div>

  return (
    <>
      {/* Extra SEO tags */}
      <ArticleSEO post={post} />
      {/* Your article UI */}
      <main className="prose mx-auto py-10">
        <h1>{post.title}</h1>
        {/* Render your rich text... */}
      </main>
    </>
  )
}
```

---

### 3) Tips for wiring to Payload

- In `getPost`, fetch from Payload’s REST or GraphQL and **populate upload URLs** (e.g., `?depth=1`) so `featuredImage.url` etc. exist.
- If you set `canonicalURL` in Payload, it will be used; otherwise the helper builds `/posts/[slug]`.
- Site-wide items (verification tokens, icons) can live in a **Global** (e.g., `siteSettings`) and merged into the `SITE` object before calling `buildMetadata`.

If you want, I can adapt `getPost()` to your exact Payload endpoint and return a fully typed object (with `depth=2`, auth headers, etc.).
