// src/collections/posts.ts
import type { CollectionConfig, PayloadRequest } from 'payload'

/**
 * ---------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------
 */

// Slugify similar to your original (kept deterministic + ASCII only)
const slugify = (str: string) =>
  (str || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)

// Works with Lexical richText (Payload 3.x) or basic rich text
const rtNodesToPlainText = (nodes: any): string => {
  if (!nodes) return ''
  if (typeof nodes === 'string') return nodes
  if (Array.isArray(nodes)) return nodes.map(rtNodesToPlainText).join(' ')
  if (typeof nodes === 'object') {
    const t = typeof nodes.text === 'string' ? nodes.text : ''
    const ch = nodes.children ? rtNodesToPlainText(nodes.children) : ''
    return [t, ch].filter(Boolean).join(' ')
  }
  return ''
}

const countWords = (s: string) => (s.trim().match(/\b[\w’'-]+\b/g) || []).length

// Build absolute URL from site base + path
const withBase = (path: string) => {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    ''
  if (!base) return path
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`
}

// Safe URL extractor for media relations (when populated)
const mediaUrl = (m: any): string | undefined => {
  if (!m) return undefined
  if (typeof m === 'string') return undefined // id only (no URL known here)
  return m.url || undefined
}

// Ensure OG/Twitter images mirror featuredImage when not set
const mirrorShareImages = async ({
  data,
  req,
}: {
  data: any
  req: PayloadRequest
}) => {
  const featured = data?.featuredImage
  if (!featured) return data

  // Top-level Open Graph tab
  if (!data?.openGraph?.ogImage) {
    data.openGraph = data.openGraph ?? {}
    data.openGraph.ogImage = featured
  }

  // Top-level Twitter tab
  if (!data?.twitter?.twitterImage) {
    data.twitter = data.twitter ?? {}
    data.twitter.twitterImage = featured
  }

  return data
}

/**
 * ---------------------------------------------------------------------------
 * Collection
 * ---------------------------------------------------------------------------
 */

const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Post', plural: 'Posts' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'datePublished', 'status'],
    group: 'Content',
    preview: (doc: any) => {
      const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3003'
      const path = `/posts/${doc?.slug || ''}`
      const secret = process.env.PREVIEW_SECRET || ''
      const qs = new URLSearchParams({
        path,
        collection: 'posts',
        slug: String(doc?.slug || ''),
        previewSecret: secret,
      }).toString()
      return `${base}/preview?${qs}`
    },
  },
  versions: { drafts: true },
  timestamps: true, // adds createdAt / updatedAt
  access: { read: () => true },

  /**
   * -------------------------------------------------------------------------
   * Fields
   * -------------------------------------------------------------------------
   */
  fields: [
    // Core authoring
    {
      type: 'row',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: { width: '70%' },
          validate: (val: string | null | undefined) =>
            (val && val.trim().length > 3) || 'Title must be at least 4 characters',
        },
        {
          name: 'slug',
          type: 'text',
          unique: true,
          admin: { width: '30%' },
          hooks: {
            beforeValidate: [
              ({ value, siblingData }) =>
                value && value.trim().length > 0
                  ? slugify(value)
                  : slugify(siblingData?.title || ''),
            ],
          },
        },
      ],
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: { description: 'Short summary used in cards and meta description fallback.' },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media', // change if your uploads collection uses a different slug
      admin: { description: 'Primary share/preview image.' },
    },
    {
      name: 'content',
      type: 'richText',
    },

    // Dates / Status
    {
      type: 'row',
      fields: [
        { name: 'datePublished', type: 'date', admin: { width: '50%' } },
        { name: 'dateModified', type: 'date', admin: { width: '50%' } },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },

    // SEO / Meta organized into tabs
    {
      type: 'tabs',
      tabs: [
        /**
         * Core Meta
         */
        {
          label: 'Core Meta',
          fields: [
            {
              name: 'seo',
              type: 'group',
              fields: [
                { name: 'pageTitle', type: 'text' },
                {
                  name: 'metaDescription',
                  type: 'textarea',
                  admin: { description: 'If empty, falls back to excerpt (at render time).' },
                },
                { name: 'metaKeywords', type: 'text' },
                { name: 'metaAuthor', type: 'text' },
                {
                  name: 'robots',
                  type: 'text',
                  defaultValue:
                    'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
                },
                { name: 'canonicalURL', type: 'text' },
                { name: 'charset', type: 'text', defaultValue: 'UTF-8' },
                {
                  name: 'viewport',
                  type: 'text',
                  defaultValue: 'width=device-width, initial-scale=1',
                },
                { name: 'themeColor', type: 'text', defaultValue: '#000000' },
                { name: 'language', type: 'text', defaultValue: 'en-ZA' },
                { name: 'revisitAfter', type: 'text', defaultValue: '7 days' },
              ],
            },
          ],
        },

        /**
         * Open Graph
         */
        {
          label: 'Open Graph',
          fields: [
            {
              name: 'openGraph',
              type: 'group',
              fields: [
                { name: 'ogTitle', type: 'text' },
                { name: 'ogDescription', type: 'textarea' },
                {
                  name: 'ogType',
                  type: 'select',
                  options: ['article', 'website', 'profile', 'video.other'],
                  defaultValue: 'article',
                },
                { name: 'ogURL', type: 'text' },
                { name: 'ogImage', type: 'upload', relationTo: 'media' },
                { name: 'ogImageAlt', type: 'text' },
                { name: 'ogSiteName', type: 'text' },
                { name: 'ogLocale', type: 'text', defaultValue: 'en_ZA' },

                // Article extensions
                { name: 'articleAuthor', type: 'text' },
                { name: 'articlePublishedTime', type: 'date' },
                { name: 'articleModifiedTime', type: 'date' },
                { name: 'articleSection', type: 'text' },
                {
                  name: 'articleTags',
                  type: 'array',
                  labels: { singular: 'Tag', plural: 'Tags' },
                  fields: [{ name: 'tag', type: 'text' }],
                },
              ],
            },
          ],
        },

        /**
         * Twitter (X)
         */
        {
          label: 'Twitter',
          fields: [
            {
              name: 'twitter',
              type: 'group',
              fields: [
                {
                  name: 'twitterCard',
                  type: 'select',
                  options: ['summary_large_image', 'summary'],
                  defaultValue: 'summary_large_image',
                },
                { name: 'twitterTitle', type: 'text' },
                { name: 'twitterDescription', type: 'textarea' },
                { name: 'twitterImage', type: 'upload', relationTo: 'media' },
                { name: 'twitterImageAlt', type: 'text' },
                { name: 'twitterSite', type: 'text' },
                { name: 'twitterCreator', type: 'text' },
              ],
            },
          ],
        },

        /**
         * Schema.org
         */
        {
          label: 'Schema.org',
          fields: [
            {
              name: 'jsonld',
              type: 'group',
              fields: [
                { name: 'generateJSONLD', type: 'checkbox', defaultValue: true },
                {
                  name: 'schemaType',
                  type: 'select',
                  options: ['Article', 'BlogPosting', 'NewsArticle'],
                  defaultValue: 'Article',
                },
                { name: 'headline', type: 'text' },
                { name: 'schemaDescription', type: 'textarea' },
                { name: 'schemaArticleSection', type: 'text' },
                { name: 'schemaKeywords', type: 'text' },
                { name: 'inLanguage', type: 'text', defaultValue: 'en-ZA' },
                { name: 'isAccessibleForFree', type: 'checkbox', defaultValue: true },
                {
                  name: 'schemaImages',
                  type: 'array',
                  fields: [
                    { name: 'image', type: 'upload', relationTo: 'media' },
                    { name: 'alt', type: 'text' },
                  ],
                },
                {
                  name: 'schemaAuthor',
                  type: 'group',
                  fields: [
                    { name: 'name', type: 'text' },
                    { name: 'url', type: 'text' },
                    {
                      name: 'sameAs',
                      type: 'array',
                      fields: [{ name: 'url', type: 'text' }],
                    },
                  ],
                },
                {
                  name: 'schemaPublisher',
                  type: 'group',
                  fields: [
                    { name: 'name', type: 'text' },
                    { name: 'logo', type: 'upload', relationTo: 'media' },
                  ],
                },
                { name: 'wordCount', type: 'number' },
                { name: 'schemaURL', type: 'text' },
                { name: 'mainEntityOfPage', type: 'text' },
                {
                  name: 'breadcrumbs',
                  type: 'array',
                  labels: { singular: 'Crumb', plural: 'Breadcrumbs' },
                  fields: [
                    { name: 'position', type: 'number' },
                    { name: 'name', type: 'text' },
                    { name: 'item', type: 'text' },
                  ],
                },
                {
                  name: 'organization',
                  type: 'group',
                  fields: [
                    { name: 'name', type: 'text' },
                    { name: 'url', type: 'text' },
                    { name: 'logo', type: 'upload', relationTo: 'media' },
                    { name: 'sameAs', type: 'array', fields: [{ name: 'url', type: 'text' }] },
                  ],
                },
                {
                  name: 'webSite',
                  type: 'group',
                  fields: [
                    { name: 'url', type: 'text' },
                    { name: 'name', type: 'text' },
                    {
                      name: 'searchAction',
                      type: 'group',
                      fields: [
                        { name: 'target', type: 'text' },
                        {
                          name: 'queryInput',
                          type: 'text',
                          defaultValue: 'required name=search_term_string',
                        },
                      ],
                    },
                  ],
                },
                {
                  name: 'webPage',
                  type: 'group',
                  fields: [
                    { name: 'url', type: 'text' },
                    { name: 'name', type: 'text' },
                    { name: 'inLanguage', type: 'text', defaultValue: 'en-ZA' },
                    { name: 'description', type: 'textarea' },
                  ],
                },
              ],
            },
          ],
        },

        /**
         * Internationalization
         */
        {
          label: 'Internationalization',
          fields: [
            {
              name: 'hreflang',
              type: 'array',
              labels: { singular: 'Alt URL', plural: 'Alt URLs' },
              fields: [
                { name: 'locale', type: 'text', required: true },
                { name: 'url', type: 'text', required: true },
              ],
            },
          ],
        },

        /**
         * Icons & App
         */
        {
          label: 'Icons & App',
          fields: [
            { name: 'faviconICO', type: 'upload', relationTo: 'media' },
            { name: 'iconSVG', type: 'upload', relationTo: 'media' },
            { name: 'appleTouchIcon', type: 'upload', relationTo: 'media' },
            { name: 'webAppManifest', type: 'upload', relationTo: 'media' },
          ],
        },

        /**
         * Performance
         */
        {
          label: 'Performance',
          fields: [
            { name: 'cdnDomain', type: 'text' },
            { name: 'analyticsOrAdsDomain', type: 'text' },
            {
              name: 'preconnect',
              type: 'array',
              fields: [{ name: 'href', type: 'text' }],
            },
            {
              name: 'dnsPrefetch',
              type: 'array',
              fields: [{ name: 'href', type: 'text' }],
            },
            {
              name: 'preloadImages',
              type: 'array',
              fields: [
                { name: 'href', type: 'text' },
                { name: 'imagesrcset', type: 'text' },
                { name: 'imagesizes', type: 'text' },
                { name: 'as', type: 'text', defaultValue: 'image' },
              ],
            },
          ],
        },

        /**
         * Feeds & AMP
         */
        {
          label: 'Feeds & AMP',
          fields: [
            { name: 'rssLink', type: 'text' },
            { name: 'amphtmlLink', type: 'text' },
          ],
        },

        /**
         * Verification
         */
        {
          label: 'Verification',
          fields: [
            { name: 'googleSiteVerification', type: 'text' },
            { name: 'bingMsValidate', type: 'text' },
            { name: 'yandexVerification', type: 'text' },
          ],
        },

        /**
         * Pagination
         */
        {
          label: 'Pagination',
          fields: [
            { name: 'prevURL', type: 'text' },
            { name: 'nextURL', type: 'text' },
          ],
        },

        /**
         * Analytics / Tags
         */
        {
          label: 'Analytics/Tags',
          fields: [
            { name: 'gtmID', type: 'text' },
            { name: 'gaMeasurementID', type: 'text' },
            { name: 'facebookPixelID', type: 'text' },
          ],
        },
      ],
    },
  ],

  /**
   * -------------------------------------------------------------------------
   * Hooks
   * -------------------------------------------------------------------------
   */
  hooks: {
    beforeValidate: [
      // Ensure slug present even if user didn’t edit slug field directly
      ({ data }) => {
        if (data?.title && !data?.slug) data.slug = slugify(data.title)
        return data
      },
    ],
    beforeChange: [
      // Default dates; mirror share images; compute word count; set OG/Twitter fallbacks
      async ({ data, operation, req }) => {
        const nowISO = new Date().toISOString()

        // Set publish date on first publish
        if (!data.datePublished && (operation === 'create' || data.status === 'published')) {
          data.datePublished = nowISO
        }
        // Always update modified date
        data.dateModified = nowISO

        // Mirror OG/Twitter image from featuredImage if empty
        data = await mirrorShareImages({ data, req })

        // JSON-LD word count from content + excerpt
        const contentText = rtNodesToPlainText(data?.content)
        const excerptText = data?.excerpt || ''
        const words = countWords(`${contentText} ${excerptText}`.trim())
        data.jsonld = data.jsonld ?? {}
        if (!data.jsonld.wordCount || words > 0) {
          data.jsonld.wordCount = words
        }

        // Ensure openGraph object exists; mirror article times from dates
        data.openGraph = data.openGraph ?? {}
        if (!data.openGraph.articlePublishedTime && data.datePublished) {
          data.openGraph.articlePublishedTime = data.datePublished
        }
        if (!data.openGraph.articleModifiedTime && data.dateModified) {
          data.openGraph.articleModifiedTime = data.dateModified
        }

        // If Twitter title/description empty, fallback to pageTitle/excerpt
        data.twitter = data.twitter ?? {}
        if (!data.twitter.twitterTitle && data.seo?.pageTitle) {
          data.twitter.twitterTitle = data.seo.pageTitle
        }
        if (!data.twitter.twitterDescription) {
          data.twitter.twitterDescription =
            data.seo?.metaDescription || data.excerpt || ''
        }

        return data
      },
    ],
    afterRead: [
      // Compute seoComputed (for meta tags) and jsonLD (for <script type="application/ld+json">)
      async ({ doc }) => {
        const path = `/posts/${doc?.slug || ''}`
        const canonical = doc?.seo?.canonicalURL || withBase(path)
        const title = doc?.seo?.pageTitle || doc?.title || ''
        const description = doc?.seo?.metaDescription || doc?.excerpt || ''

        // Robots: use free-text field if present; else default
        const robots =
          doc?.seo?.robots ||
          'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'

        // Open Graph: prefer explicit values, otherwise sensible fallbacks
        const og = (doc?.openGraph ?? {}) as any
        const ogTitle = og.ogTitle || title
        const ogDescription = og.ogDescription || description
        const ogType = og.ogType || 'article'
        const ogURL = og.ogURL || canonical
        const ogImage = og.ogImage || doc?.twitter?.twitterImage || doc?.featuredImage || null
        const ogImageAlt = og.ogImageAlt || doc?.twitter?.twitterImageAlt || ''
        const ogSiteName = og.ogSiteName || process.env.NEXT_PUBLIC_SITE_NAME || ''
        const ogLocale = og.ogLocale || doc?.seo?.language || 'en-ZA'
        const ogArticle = {
          author: og.articleAuthor || '',
          publishedTime: og.articlePublishedTime || doc?.datePublished || null,
          modifiedTime: og.articleModifiedTime || doc?.dateModified || null,
          section: og.articleSection || '',
          tags: Array.isArray(og.articleTags) ? og.articleTags.map((t: any) => t.tag) : [],
        }

        // Twitter
        const tw = (doc?.twitter ?? {}) as any
        const twitterCard = tw.twitterCard || 'summary_large_image'
        const twitterTitle = tw.twitterTitle || ogTitle
        const twitterDescription = tw.twitterDescription || ogDescription
        const twitterImage = tw.twitterImage || ogImage || null
        const twitterImageAlt = tw.twitterImageAlt || ogImageAlt
        const twitterSite = tw.twitterSite || process.env.NEXT_PUBLIC_TWITTER_SITE || ''
        const twitterCreator =
          tw.twitterCreator || process.env.NEXT_PUBLIC_TWITTER_CREATOR || ''

        // Internationalization alternates from hreflang array
        const alternates = Array.isArray(doc?.hreflang)
          ? doc.hreflang.map((h: any) => ({ hrefLang: h.locale, href: h.url }))
          : []

          ; (doc as any).seoComputed = {
            meta: { title, description, canonical, robots },
            openGraph: {
              title: ogTitle,
              description: ogDescription,
              type: ogType,
              url: ogURL,
              image: ogImage,
              imageAlt: ogImageAlt,
              siteName: ogSiteName,
              locale: ogLocale,
              article: ogArticle,
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
          }

        /**
         * ----------------------------- JSON-LD -------------------------------
         */
        const generateJSONLD = doc?.jsonld?.generateJSONLD !== false

        // Article | BlogPosting | NewsArticle
        let articleLD: any | undefined
        if (generateJSONLD) {
          const ldType = doc?.jsonld?.schemaType || 'Article'
          const ldHeadline = doc?.jsonld?.headline || doc?.title || ''
          const ldDesc = doc?.jsonld?.schemaDescription || description
          const ldSection = doc?.jsonld?.schemaArticleSection || ogArticle.section || undefined
          const ldKeywords =
            doc?.jsonld?.schemaKeywords ||
            (Array.isArray(ogArticle.tags) && ogArticle.tags.length
              ? ogArticle.tags.join(',')
              : undefined)
          const ldInLang = doc?.jsonld?.inLanguage || doc?.seo?.language || 'en-ZA'
          const ldAccessible = typeof doc?.jsonld?.isAccessibleForFree === 'boolean'
            ? doc.jsonld.isAccessibleForFree
            : true

          // Images
          let ldImages: string[] | undefined
          if (Array.isArray(doc?.jsonld?.schemaImages) && doc.jsonld.schemaImages.length) {
            ldImages = doc.jsonld.schemaImages
              .map((i: any) => mediaUrl(i?.image))
              .filter(Boolean) as string[]
          } else {
            const ogImgUrl = mediaUrl(ogImage)
            ldImages = ogImgUrl ? [ogImgUrl] : undefined
          }

          // Author
          let ldAuthor: any | undefined
          if (doc?.jsonld?.schemaAuthor?.name) {
            ldAuthor = {
              '@type': 'Person',
              name: doc.jsonld.schemaAuthor.name,
              url: doc.jsonld.schemaAuthor.url || undefined,
              sameAs:
                Array.isArray(doc.jsonld.schemaAuthor.sameAs)
                  ? doc.jsonld.schemaAuthor.sameAs.map((x: any) => x.url).filter(Boolean)
                  : undefined,
            }
          }

          // Publisher
          let ldPublisher: any | undefined
          if (doc?.jsonld?.schemaPublisher?.name) {
            const logoUrl = mediaUrl(doc.jsonld.schemaPublisher.logo)
            ldPublisher = {
              '@type': 'Organization',
              name: doc.jsonld.schemaPublisher.name,
              logo: logoUrl ? { '@type': 'ImageObject', url: logoUrl } : undefined,
            }
          }

          articleLD = {
            '@context': 'https://schema.org',
            '@type': ldType,
            headline: ldHeadline,
            description: ldDesc,
            inLanguage: ldInLang,
            isAccessibleForFree: ldAccessible,
            image: ldImages,
            mainEntityOfPage: doc?.jsonld?.mainEntityOfPage || canonical,
            datePublished: doc?.datePublished,
            dateModified: doc?.dateModified,
            wordCount: doc?.jsonld?.wordCount,
            author: ldAuthor,
            publisher: ldPublisher,
            articleSection: ldSection,
            keywords: ldKeywords,
          }
        }

        // Organization (optional, from jsonld.organization)
        let orgLD: any | undefined
        if (doc?.jsonld?.organization?.name) {
          const o = doc.jsonld.organization
          const logo = mediaUrl(o.logo)
          orgLD = {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: o.name,
            url: o.url || undefined,
            logo: logo ? { '@type': 'ImageObject', url: logo } : undefined,
            sameAs: Array.isArray(o.sameAs) ? o.sameAs.map((x: any) => x.url).filter(Boolean) : undefined,
          }
        }

        // WebSite (optional)
        let siteLD: any | undefined
        if (doc?.jsonld?.webSite?.url && doc?.jsonld?.webSite?.name) {
          const ws = doc.jsonld.webSite
          siteLD = {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            url: ws.url,
            name: ws.name,
            potentialAction: ws.searchAction?.target
              ? {
                '@type': 'SearchAction',
                target: ws.searchAction.target,
                queryInput: ws.searchAction.queryInput || 'required name=search_term_string',
              }
              : undefined,
          }
        }

        // WebPage (optional)
        let pageLD: any | undefined
        if (doc?.jsonld?.webPage?.url || doc?.jsonld?.webPage?.name) {
          const wp = doc.jsonld.webPage
          pageLD = {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            url: wp.url || canonical,
            name: wp.name || title,
            inLanguage: wp.inLanguage || doc?.seo?.language || 'en-ZA',
            description: wp.description || description,
          }
        }

        // Breadcrumbs (optional)
        let breadcrumbLD: any | undefined
        if (Array.isArray(doc?.jsonld?.breadcrumbs) && doc.jsonld.breadcrumbs.length) {
          const items = [...doc.jsonld.breadcrumbs]
            .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
            .map((b: any) => ({
              '@type': 'ListItem',
              position: b.position || 1,
              name: b.name,
              item: b.item,
            }))
          breadcrumbLD = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: items,
          }
        }

        // Attach computed JSON-LD array
        ; (doc as any).jsonLD = [articleLD, orgLD, siteLD, pageLD, breadcrumbLD].filter(Boolean)

        return doc
      },
    ],
  },
}

export default Posts
export { Posts }
