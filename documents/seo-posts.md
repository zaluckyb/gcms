{
"name": "seo",
"label": "SEO & Metadata",
"type": "group",
"fields": [
{
"name": "metaTitle",
"label": "Meta Title",
"type": "text",
"required": true,
"maxLength": 60
},
{
"name": "metaDescription",
"label": "Meta Description",
"type": "textarea",
"required": true,
"maxLength": 160
},
{
"name": "canonicalURL",
"label": "Canonical URL",
"type": "text"
},
{
"name": "robots",
"label": "Robots Directives",
"type": "select",
"options": [
{ "label": "Index, Follow", "value": "index, follow" },
{ "label": "No Index, Follow", "value": "noindex, follow" },
{ "label": "Index, No Follow", "value": "index, nofollow" },
{ "label": "No Index, No Follow", "value": "noindex, nofollow" }
],
"defaultValue": "index, follow"
},
{
"name": "openGraph",
"label": "Open Graph (Social Sharing)",
"type": "group",
"fields": [
{ "name": "ogTitle", "label": "OG Title", "type": "text" },
{ "name": "ogDescription", "label": "OG Description", "type": "textarea" },
{ "name": "ogImage", "label": "OG Image", "type": "upload", "relationTo": "media" },
{ "name": "ogType", "label": "OG Type", "type": "text", "defaultValue": "website" },
{ "name": "ogURL", "label": "OG URL", "type": "text" },
{ "name": "ogSiteName", "label": "OG Site Name", "type": "text" }
]
},
{
"name": "twitter",
"label": "Twitter Card",
"type": "group",
"fields": [
{ "name": "twitterCard", "label": "Card Type", "type": "select", "options": [
{ "label": "Summary", "value": "summary" },
{ "label": "Summary Large Image", "value": "summary_large_image" }
], "defaultValue": "summary_large_image" },
{ "name": "twitterTitle", "label": "Twitter Title", "type": "text" },
{ "name": "twitterDescription", "label": "Twitter Description", "type": "textarea" },
{ "name": "twitterImage", "label": "Twitter Image", "type": "upload", "relationTo": "media" },
{ "name": "twitterSite", "label": "Twitter @Handle", "type": "text" }
]
},
{
"name": "technical",
"label": "Technical Meta Tags",
"type": "group",
"fields": [
{ "name": "charset", "label": "Character Set", "type": "text", "defaultValue": "UTF-8" },
{ "name": "viewport", "label": "Viewport", "type": "text", "defaultValue": "width=device-width, initial-scale=1.0" },
{ "name": "themeColor", "label": "Theme Color", "type": "text" },
{ "name": "language", "label": "Language (e.g. en-ZA)", "type": "text", "defaultValue": "en-ZA" }
]
},
{
"name": "schemaMarkup",
"label": "Structured Data (JSON-LD)",
"type": "code",
"admin": { "language": "json" }
}
]
}

{
"slug": "articles",
"labels": { "singular": "Article", "plural": "Articles" },
"admin": { "useAsTitle": "title", "defaultColumns": ["title", "status", "datePublished"] },
"versions": { "drafts": true },
"access": {
"read": true
},
"fields": [
/_ ─────────── 1) CORE ─────────── _/
{
"type": "row",
"fields": [
{ "name": "title", "type": "text", "label": "Title", "required": true, "admin": { "width": "66%" } },
{ "name": "slug", "type": "text", "label": "Slug", "unique": true, "required": true, "admin": { "width": "34%" } }
]
},
{ "name": "excerpt", "type": "textarea", "label": "Excerpt / Summary", "maxLength": 300 },
{
"name": "body",
"label": "Article Body",
"type": "richText",
"required": true
},
{
"type": "row",
"fields": [
{ "name": "articleSection", "type": "text", "label": "Section (Category Label)" },
{ "name": "language", "type": "text", "label": "Language (e.g. en-ZA)", "defaultValue": "en-ZA" }
]
},
{
"type": "row",
"fields": [
{ "name": "datePublished", "type": "date", "label": "Date Published", "required": true },
{ "name": "dateModified", "type": "date", "label": "Date Modified" }
]
},

    /* ─────────── 2) AUTHOR ─────────── */
    {
      "name": "author",
      "label": "Author",
      "type": "relationship",
      "relationTo": "authors",
      "required": true
    },

    /* ─────────── 3) MEDIA ─────────── */
    {
      "name": "featuredImage",
      "label": "Featured Image",
      "type": "upload",
      "relationTo": "media"
    },
    {
      "name": "gallery",
      "label": "Inline Images / Gallery",
      "type": "array",
      "fields": [
        { "name": "image", "type": "upload", "relationTo": "media", "required": true },
        { "name": "alt", "type": "text", "label": "Alt text", "required": true },
        { "name": "caption", "type": "text" }
      ]
    },

    /* ─────────── 4) TAXONOMY ─────────── */
    {
      "type": "row",
      "fields": [
        {
          "name": "categories",
          "label": "Categories",
          "type": "relationship",
          "relationTo": "categories",
          "hasMany": true
        },
        {
          "name": "tags",
          "label": "Tags",
          "type": "relationship",
          "relationTo": "tags",
          "hasMany": true
        }
      ]
    },

    /* ─────────── 5) UX METRICS ─────────── */
    {
      "type": "row",
      "fields": [
        { "name": "wordCount", "type": "number", "label": "Word Count", "admin": { "readOnly": true } },
        { "name": "readingTimeMinutes", "type": "number", "label": "Estimated Reading Time (min)", "admin": { "readOnly": true } }
      ]
    },
    {
      "name": "tableOfContents",
      "label": "Table of Contents",
      "type": "array",
      "admin": { "description": "Auto-generate from headings or manage manually." },
      "fields": [
        { "name": "id", "type": "text", "label": "Anchor ID" },
        { "name": "text", "type": "text", "label": "Heading Text" },
        { "name": "level", "type": "number", "label": "Level (2-6)" }
      ]
    },

    /* ─────────── 6) LINKS & RELATIONS ─────────── */
    {
      "name": "breadcrumbs",
      "label": "Breadcrumbs",
      "type": "array",
      "fields": [
        { "name": "label", "type": "text", "required": true },
        { "name": "url", "type": "text", "required": true }
      ]
    },
    {
      "name": "relatedArticles",
      "label": "Related Articles",
      "type": "relationship",
      "relationTo": "articles",
      "hasMany": true
    },

    /* ─────────── 7) ENHANCED CONTENT ─────────── */
    {
      "name": "faq",
      "label": "FAQ (Q&A)",
      "type": "array",
      "admin": { "description": "Renders FAQPage schema when populated." },
      "fields": [
        { "name": "question", "type": "text", "required": true },
        { "name": "answer", "type": "richText", "required": true }
      ]
    },
    {
      "name": "howTo",
      "label": "How-To",
      "type": "group",
      "admin": { "description": "Fill for HowTo schema." },
      "fields": [
        { "name": "name", "type": "text", "label": "How-To Name" },
        { "name": "description", "type": "textarea" },
        {
          "name": "steps",
          "label": "Steps",
          "type": "array",
          "fields": [
            { "name": "name", "type": "text", "required": true },
            { "name": "text", "type": "textarea", "required": true },
            { "name": "image", "type": "upload", "relationTo": "media" }
          ]
        }
      ]
    },
    {
      "name": "video",
      "label": "Video",
      "type": "group",
      "fields": [
        { "name": "url", "type": "text", "admin": { "description": "Canonical video URL (YouTube/Vimeo/self-hosted)" } },
        { "name": "embedCode", "type": "code", "admin": { "language": "html" } }
      ]
    },

    /* ─────────── 8) SEO (incl. OG/Twitter) ─────────── */
    {
      "name": "seo",
      "label": "SEO & Metadata",
      "type": "group",
      "fields": [
        { "name": "metaTitle", "type": "text", "required": true, "maxLength": 60 },
        { "name": "metaDescription", "type": "textarea", "required": true, "maxLength": 160 },
        { "name": "canonicalURL", "type": "text" },
        {
          "name": "robots",
          "type": "select",
          "options": [
            { "label": "Index, Follow", "value": "index, follow" },
            { "label": "No Index, Follow", "value": "noindex, follow" },
            { "label": "Index, No Follow", "value": "index, nofollow" },
            { "label": "No Index, No Follow", "value": "noindex, nofollow" }
          ],
          "defaultValue": "index, follow"
        },
        {
          "name": "alternateLangs",
          "label": "Alternate Language URLs (hreflang)",
          "type": "array",
          "fields": [
            { "name": "lang", "type": "text", "label": "Lang (e.g. en-ZA)", "required": true },
            { "name": "url", "type": "text", "required": true }
          ]
        },
        {
          "name": "openGraph",
          "label": "Open Graph",
          "type": "group",
          "fields": [
            { "name": "ogTitle", "type": "text" },
            { "name": "ogDescription", "type": "textarea" },
            { "name": "ogImage", "type": "upload", "relationTo": "media" },
            { "name": "ogType", "type": "text", "defaultValue": "article" },
            { "name": "ogURL", "type": "text" },
            { "name": "ogSiteName", "type": "text" }
          ]
        },
        {
          "name": "twitter",
          "label": "Twitter Card",
          "type": "group",
          "fields": [
            {
              "name": "twitterCard",
              "type": "select",
              "options": [
                { "label": "Summary", "value": "summary" },
                { "label": "Summary Large Image", "value": "summary_large_image" }
              ],
              "defaultValue": "summary_large_image"
            },
            { "name": "twitterTitle", "type": "text" },
            { "name": "twitterDescription", "type": "textarea" },
            { "name": "twitterImage", "type": "upload", "relationTo": "media" },
            { "name": "twitterSite", "type": "text", "label": "@handle" }
          ]
        },
        {
          "name": "schemaMarkup",
          "label": "Structured Data (JSON-LD)",
          "type": "code",
          "admin": { "language": "json" }
        }
      ]
    },

    /* ─────────── 9) SOCIAL / INTERACTION ─────────── */
    {
      "type": "row",
      "fields": [
        { "name": "enableShareButtons", "type": "checkbox", "label": "Show Share Buttons", "defaultValue": true },
        { "name": "enableComments", "type": "checkbox", "label": "Enable Comments", "defaultValue": false }
      ]
    },

    /* ─────────── 10) PUBLISHING FLOW ─────────── */
    {
      "type": "row",
      "fields": [
        {
          "name": "status",
          "type": "select",
          "required": true,
          "defaultValue": "draft",
          "options": [
            { "label": "Draft", "value": "draft" },
            { "label": "Published", "value": "published" }
          ]
        },
        { "name": "schedulePublishAt", "type": "date", "label": "Schedule Publish At" }
      ]
    }

]
}
