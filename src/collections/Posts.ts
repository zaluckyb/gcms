import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'headline',
    preview: (doc, { req, token }) => {
      const slug = typeof (doc as any)?.slug === 'string' ? (doc as any).slug : ''
      const params = new URLSearchParams({
        slug,
        collection: 'posts',
        path: `/posts/${slug}`,
        previewSecret: process.env.PREVIEW_SECRET || '',
        token: token || '',
      })
      return `/preview?${params.toString()}`
    },
  },
  hooks: {
    beforeValidate: [
      ({ data }: { data: any }) => {
        if (!data) return data
        if (!data.slug) {
          const source = data.headline || data.name || ''
          if (source) {
            data.slug = source
              .toString()
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
          }
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'headline', type: 'text', required: true, admin: { description: 'Main title (headline) of the article.' } },
    { name: 'slug', type: 'text', unique: true, index: true, admin: { description: 'URL-friendly unique slug', position: 'sidebar' } },
    { name: 'articleBody', type: 'richText', admin: { description: 'Full article content in rich text.' } },
    { name: 'articleSection', type: 'text', admin: { description: 'Section or category where the article appears.' } },
    { name: 'dateline', type: 'text', admin: { description: 'Place and/or date of publication.' } },
    { name: 'pageStart', type: 'number', admin: { description: 'Page where the work starts (print).' } },
    { name: 'pageEnd', type: 'number', admin: { description: 'Page where the work ends (print).' } },
    { name: 'pagination', type: 'text', admin: { description: 'Page range description.' } },
    { name: 'speakable', type: 'text', admin: { description: 'Content suitable for spoken results / voice assistants.' } },
    { name: 'wordCount', type: 'number', admin: { description: 'Approximate word count of the article.' } },
    { name: 'about', type: 'text', admin: { description: 'Subject matter of the content.' } },
    { name: 'abstract', type: 'textarea', admin: { description: 'Short summary of the article.' } },
    { name: 'accessMode', type: 'text', admin: { description: 'Human sensory mode used to perceive content.' } },
    { name: 'accessibilityFeature', type: 'text', admin: { description: 'Features that improve accessibility.' } },
    { name: 'author', type: 'relationship', relationTo: 'users', admin: { description: 'Author of the creative work.' } },
    { name: 'datePublished', type: 'date', admin: { description: 'Publication date.' } },
    { name: 'dateModified', type: 'date', admin: { description: 'Last modified date.' } },
    { name: 'publisher', type: 'text', admin: { description: 'Publisher of the work.' } },
    { name: 'inLanguage', type: 'text', admin: { description: 'Language of the content (code or name).' } },
    {
      name: 'keywords',
      type: 'array',
      admin: { description: 'Keywords or tags.' },
      fields: [{ name: 'keyword', type: 'text', admin: { description: 'Keyword or tag value.' } }],
    },
    { name: 'license', type: 'text', admin: { description: 'License information or URL.' } },
    {
      name: 'comments',
      type: 'array',
      admin: { description: 'User comments for the article.' },
      fields: [
        { name: 'author', type: 'relationship', relationTo: 'users', admin: { description: 'Comment author.' } },
        { name: 'content', type: 'textarea', required: true, admin: { description: 'Comment content.' } },
        { name: 'createdAt', type: 'date', admin: { description: 'Comment creation date.' } },
      ],
    },
    { name: 'commentCount', type: 'number', admin: { description: 'Number of comments.' } },
    { name: 'mainEntityOfPage', type: 'text', admin: { description: 'Canonical entity referenced by the page.' } },
    { name: 'isPartOf', type: 'text', admin: { description: 'Publication or larger work this article belongs to.' } },
    { name: 'image', type: 'relationship', relationTo: 'media', admin: { description: 'Banner image for the article.' } },
    { name: 'url', type: 'text', admin: { description: 'Canonical URL of the article.' } },
    { name: 'description', type: 'textarea', admin: { description: 'Short description/summary of the article.' } },
    { name: 'identifier', type: 'text', admin: { description: 'Identifier used for structured data.' } },
    {
      name: 'sameAs',
      type: 'array',
      admin: { description: 'URLs to other profiles/pages of the author or work.' },
      fields: [{ name: 'url', type: 'text', admin: { description: 'External URL.' } }],
    },
  ],
}