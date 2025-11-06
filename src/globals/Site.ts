import type { GlobalConfig } from 'payload'

export const Site: GlobalConfig = {
  slug: 'site',
  label: 'Site Configuration',
  admin: {
    group: 'Settings',
    description: 'Global site settings and defaults for SEO, social media, and performance',
  },
  access: {
    read: () => true,
    update: ({ req }) => !!req.user, // Only authenticated users can update
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        // Site Identity Tab
        {
          label: 'Site Identity',
          description: 'Basic site information and branding',
          fields: [
            {
              name: 'siteName',
              type: 'text',
              required: true,
              defaultValue: 'Web Developer',
              admin: {
                description: 'The name of your website',
              },
            },
            {
              name: 'siteUrl',
              type: 'text',
              required: true,
              defaultValue: 'https://webdeveloper.org.za/',
              admin: {
                description: 'The base URL of your website (without trailing slash)',
              },
              validate: (val: string | null | undefined) => {
                if (!val) return 'Site URL is required'
                try {
                  new URL(val)
                  return true
                } catch {
                  return 'Please enter a valid URL'
                }
              },
            },
            {
              name: 'siteDescription',
              type: 'textarea',
              defaultValue: 'Professional web development services in South Africa',
              admin: {
                description: 'Default description used for meta tags and social media',
              },
            },
            {
              name: 'siteTagline',
              type: 'text',
              admin: {
                description: 'Short tagline or slogan for your site',
              },
            },
          ],
        },

        // SEO Defaults Tab
        {
          label: 'SEO Defaults',
          description: 'Default SEO settings applied to all pages',
          fields: [
            {
              name: 'seoDefaults',
              type: 'group',
              fields: [
                {
                  name: 'metaAuthor',
                  type: 'text',
                  defaultValue: 'Web Developer',
                  admin: {
                    description: 'Default author for meta tags',
                  },
                },
                {
                  name: 'robots',
                  type: 'text',
                  defaultValue: 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
                  admin: {
                    description: 'Default robots directive for search engines',
                  },
                },
                {
                  name: 'charset',
                  type: 'text',
                  defaultValue: 'UTF-8',
                  admin: {
                    description: 'Character encoding for the site',
                  },
                },
                {
                  name: 'viewport',
                  type: 'text',
                  defaultValue: 'width=device-width, initial-scale=1',
                  admin: {
                    description: 'Default viewport meta tag',
                  },
                },
                {
                  name: 'themeColor',
                  type: 'text',
                  defaultValue: '#000000',
                  admin: {
                    description: 'Theme color for mobile browsers',
                  },
                },
                {
                  name: 'language',
                  type: 'text',
                  defaultValue: 'en-ZA',
                  admin: {
                    description: 'Default language code',
                  },
                },
                {
                  name: 'revisitAfter',
                  type: 'text',
                  defaultValue: '7 days',
                  admin: {
                    description: 'How often search engines should revisit',
                  },
                },
              ],
            },
          ],
        },

        // Open Graph Tab
        {
          label: 'Open Graph',
          description: 'Default Open Graph settings for social media sharing',
          fields: [
            {
              name: 'openGraphDefaults',
              type: 'group',
              fields: [
                {
                  name: 'ogSiteName',
                  type: 'text',
                  defaultValue: 'Web Developer',
                  admin: {
                    description: 'Site name for Open Graph',
                  },
                },
                {
                  name: 'ogLocale',
                  type: 'text',
                  defaultValue: 'en_ZA',
                  admin: {
                    description: 'Default locale for Open Graph',
                  },
                },
                {
                  name: 'ogType',
                  type: 'select',
                  options: [
                    { label: 'Website', value: 'website' },
                    { label: 'Article', value: 'article' },
                  ],
                  defaultValue: 'article',
                  admin: {
                    description: 'Default Open Graph type',
                  },
                },
                {
                  name: 'defaultOgImage',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'Default image for social media sharing (1200x630px recommended)',
                  },
                },
                {
                  name: 'defaultOgImageAlt',
                  type: 'text',
                  admin: {
                    description: 'Alt text for the default Open Graph image',
                  },
                },
              ],
            },
          ],
        },

        // Twitter Tab
        {
          label: 'Twitter',
          description: 'Twitter Card settings',
          fields: [
            {
              name: 'twitterDefaults',
              type: 'group',
              fields: [
                {
                  name: 'twitterCard',
                  type: 'select',
                  options: [
                    { label: 'Summary Large Image', value: 'summary_large_image' },
                    { label: 'Summary', value: 'summary' },
                  ],
                  defaultValue: 'summary_large_image',
                  admin: {
                    description: 'Default Twitter Card type',
                  },
                },
                {
                  name: 'twitterSite',
                  type: 'text',
                  defaultValue: '@webdeveloper',
                  admin: {
                    description: 'Twitter handle for the site (with @)',
                  },
                },
                {
                  name: 'twitterCreator',
                  type: 'text',
                  defaultValue: '@webdeveloper',
                  admin: {
                    description: 'Default Twitter handle for content creator (with @)',
                  },
                },
              ],
            },
          ],
        },

        // Schema.org Tab
        {
          label: 'Schema.org',
          description: 'Structured data defaults',
          fields: [
            {
              name: 'schemaDefaults',
              type: 'group',
              fields: [
                {
                  name: 'generateJSONLD',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Enable JSON-LD structured data generation',
                  },
                },
                {
                  name: 'defaultSchemaType',
                  type: 'select',
                  options: [
                    { label: 'Article', value: 'Article' },
                    { label: 'Blog Posting', value: 'BlogPosting' },
                    { label: 'News Article', value: 'NewsArticle' },
                  ],
                  defaultValue: 'Article',
                  admin: {
                    description: 'Default schema type for articles',
                  },
                },
                {
                  name: 'inLanguage',
                  type: 'text',
                  defaultValue: 'en-ZA',
                  admin: {
                    description: 'Default language for schema markup',
                  },
                },
                {
                  name: 'isAccessibleForFree',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Whether content is accessible for free',
                  },
                },
                {
                  name: 'organization',
                  type: 'group',
                  label: 'Organization Details',
                  fields: [
                    {
                      name: 'name',
                      type: 'text',
                      defaultValue: 'Web Developer',
                      admin: {
                        description: 'Organization name',
                      },
                    },
                    {
                      name: 'url',
                      type: 'text',
                      defaultValue: 'https://webdeveloper.org.za/',
                      admin: {
                        description: 'Organization website URL',
                      },
                    },
                    {
                      name: 'logo',
                      type: 'upload',
                      relationTo: 'media',
                      admin: {
                        description: 'Organization logo',
                      },
                    },
                    {
                      name: 'sameAs',
                      type: 'array',
                      label: 'Social Media Profiles',
                      fields: [
                        {
                          name: 'url',
                          type: 'text',
                          admin: {
                            description: 'Social media profile URL',
                          },
                        },
                      ],
                      admin: {
                        description: 'Social media and other profile URLs',
                      },
                    },
                  ],
                },
                {
                  name: 'publisher',
                  type: 'group',
                  label: 'Publisher Details',
                  fields: [
                    {
                      name: 'name',
                      type: 'text',
                      defaultValue: 'Web Developer',
                      admin: {
                        description: 'Publisher name',
                      },
                    },
                    {
                      name: 'logo',
                      type: 'upload',
                      relationTo: 'media',
                      admin: {
                        description: 'Publisher logo',
                      },
                    },
                  ],
                },
                {
                  name: 'webSite',
                  type: 'group',
                  label: 'Website Schema',
                  fields: [
                    {
                      name: 'url',
                      type: 'text',
                      defaultValue: 'https://webdeveloper.org.za/',
                      admin: {
                        description: 'Website URL',
                      },
                    },
                    {
                      name: 'name',
                      type: 'text',
                      defaultValue: 'Web Developer',
                      admin: {
                        description: 'Website name',
                      },
                    },
                    {
                      name: 'searchAction',
                      type: 'group',
                      label: 'Search Action',
                      fields: [
                        {
                          name: 'target',
                          type: 'text',
                          defaultValue: 'https://webdeveloper.org.za/search?q={search_term_string}',
                          admin: {
                            description: 'Search URL template',
                          },
                        },
                        {
                          name: 'queryInput',
                          type: 'text',
                          defaultValue: 'required name=search_term_string',
                          admin: {
                            description: 'Query input specification',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },

        // Site Assets Tab
        {
          label: 'Site Assets',
          description: 'Icons and app-related assets',
          fields: [
            {
              name: 'faviconICO',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Favicon (.ico file)',
              },
            },
            {
              name: 'iconSVG',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'SVG icon for modern browsers',
              },
            },
            {
              name: 'appleTouchIcon',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Apple touch icon (180x180px)',
              },
            },
            {
              name: 'webAppManifest',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Web app manifest file',
              },
            },
          ],
        },

        // Performance Tab
        {
          label: 'Performance',
          description: 'Performance optimization settings',
          fields: [
            {
              name: 'cdnDomain',
              type: 'text',
              admin: {
                description: 'CDN domain for static assets',
              },
            },
            {
              name: 'analyticsOrAdsDomain',
              type: 'text',
              admin: {
                description: 'Domain for analytics or ads',
              },
            },
            {
              name: 'preconnect',
              type: 'array',
              label: 'Preconnect Hints',
              fields: [
                {
                  name: 'href',
                  type: 'text',
                  admin: {
                    description: 'URL to preconnect to',
                  },
                },
              ],
              admin: {
                description: 'Domains to establish early connections to',
              },
            },
            {
              name: 'dnsPrefetch',
              type: 'array',
              label: 'DNS Prefetch Hints',
              fields: [
                {
                  name: 'href',
                  type: 'text',
                  admin: {
                    description: 'Domain to prefetch DNS for',
                  },
                },
              ],
              admin: {
                description: 'Domains to prefetch DNS for',
              },
            },
          ],
        },

        // Feeds & Verification Tab
        {
          label: 'Feeds & Verification',
          description: 'RSS feeds and site verification',
          fields: [
            {
              name: 'rssLink',
              type: 'text',
              defaultValue: '/rss.xml',
              admin: {
                description: 'RSS feed URL',
              },
            },
            {
              name: 'googleSiteVerification',
              type: 'text',
              admin: {
                description: 'Google Search Console verification code',
              },
            },
            {
              name: 'bingMsValidate',
              type: 'text',
              admin: {
                description: 'Bing Webmaster Tools verification code',
              },
            },
            {
              name: 'yandexVerification',
              type: 'text',
              admin: {
                description: 'Yandex Webmaster verification code',
              },
            },
          ],
        },

        // Analytics Tab
        {
          label: 'Analytics',
          description: 'Analytics and tracking configuration',
          fields: [
            {
              name: 'gtmID',
              type: 'text',
              admin: {
                description: 'Google Tag Manager ID (GTM-XXXXXXX)',
              },
            },
            {
              name: 'gaMeasurementID',
              type: 'text',
              admin: {
                description: 'Google Analytics Measurement ID (G-XXXXXXXXXX)',
              },
            },
            {
              name: 'facebookPixelID',
              type: 'text',
              admin: {
                description: 'Facebook Pixel ID',
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        // Clear any caches when site config changes
        if (req.payload.logger) {
          req.payload.logger.info('Site configuration updated, clearing caches')
        }
        return doc
      },
    ],
  },
}

export default Site