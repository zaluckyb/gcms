# Posts Collection Fields Documentation

This document provides a comprehensive overview of all fields available in the Posts collection of the Payload CMS.

## Collection Overview

- **Slug**: `posts`
- **Labels**: Post (singular), Posts (plural)
- **Admin Group**: Content
- **Versioning**: Enabled (max 10 versions per document)
- **Drafts**: Enabled
- **Timestamps**: Enabled (createdAt, updatedAt)

## Core Content Fields

### Basic Information
- **title** (text, required)
  - The main title of the post
  - Used as the display title in admin panel

- **slug** (text, required, unique, indexed)
  - URL-friendly version of the title
  - Auto-generated from title if not provided
  - Position: Sidebar

- **excerpt** (textarea)
  - Brief description of the post
  - Used for meta description if not overridden in SEO settings

- **featuredImage** (upload → media)
  - Main image for the post
  - Used for Open Graph and Twitter cards

- **content** (richText, required)
  - The main content of the post
  - Supports rich text formatting

## Relationship Fields

- **author** (relationship → users, indexed)
  - Author of this post
  - Position: Sidebar

- **tags** (relationship → tags, hasMany, indexed)
  - Tags associated with this post
  - Multiple tags can be selected

- **categories** (relationship → categories, hasMany, indexed)
  - Categories for this post
  - Multiple categories can be selected

## Publishing Fields

- **datePublished** (date, indexed)
  - When this post was first published
  - Default: Current date/time
  - Position: Sidebar
  - Picker: Day and time

- **dateModified** (date)
  - When this post was last modified
  - Position: Sidebar
  - Picker: Day and time

- **status** (select, required, indexed)
  - Publication status of the post
  - Default: 'draft'
  - Position: Sidebar
  - Options:
    - Draft
    - Published
    - Archived

## Metadata Group (Computed Fields)

All fields in this group are read-only and automatically computed:

- **metadata.readingTime** (number)
  - Estimated reading time in minutes

- **metadata.wordCount** (number)
  - Total word count

- **metadata.lastModified** (date)
  - Last modification timestamp

## SEO Override Fields

### SEO Overrides Tab
Override site-wide SEO settings for specific posts:

- **seo.pageTitle** (text)
  - Override the page title (defaults to post title)

- **seo.metaDescription** (textarea)
  - Override meta description (defaults to excerpt)

- **seo.metaKeywords** (text)
  - Comma-separated keywords for this post

- **seo.canonicalURL** (text)
  - Override canonical URL (defaults to post URL)

### Social Media Overrides Tab

#### Open Graph Group
- **openGraph.ogTitle** (text)
  - Override Open Graph title

- **openGraph.ogDescription** (textarea)
  - Override Open Graph description

- **openGraph.ogImage** (upload → media)
  - Override Open Graph image (defaults to featured image)

- **openGraph.ogImageAlt** (text)
  - Alt text for Open Graph image

- **openGraph.articleAuthor** (text)
  - Author name for article metadata

- **openGraph.articleSection** (text)
  - Article section/category

- **openGraph.articleTags** (array)
  - Tags for article metadata
  - Fields: tag (text, required)

#### Twitter Group
- **twitter.twitterTitle** (text)
  - Override Twitter card title

- **twitter.twitterDescription** (textarea)
  - Override Twitter card description

- **twitter.twitterImage** (upload → media)
  - Override Twitter card image (defaults to featured image)

- **twitter.twitterImageAlt** (text)
  - Alt text for Twitter card image

### Schema.org Overrides Tab

- **jsonld.headline** (text)
  - Override schema headline (defaults to title)

- **jsonld.schemaDescription** (textarea)
  - Override schema description

- **jsonld.schemaArticleSection** (text)
  - Article section for schema

- **jsonld.schemaKeywords** (text)
  - Comma-separated keywords for schema

- **jsonld.schemaImages** (array)
  - Additional images for schema markup
  - Fields:
    - image (upload → media, required)
    - alt (text)

- **jsonld.wordCount** (number, read-only)
  - Automatically calculated word count

- **jsonld.breadcrumbs** (array)
  - Custom breadcrumb structure (auto-generated if empty)
  - Fields:
    - position (number, required)
    - name (text, required)
    - item (text, required)

### Advanced Settings Tab

#### Internationalization
- **hreflang** (array)
  - Alternate language versions of this post
  - Fields:
    - locale (text, required) - Language code (e.g., en-US, fr-FR)
    - url (text, required) - URL for this language version

#### Performance Optimization
- **preloadImages** (array)
  - Images to preload for performance
  - Fields:
    - href (text, required)
    - imagesrcset (text)
    - imagesizes (text)
    - as (select, default: 'image')
      - Options: Image, Font, Script, Style

## Computed Fields (Hidden)

- **seoComputed** (json, read-only, hidden)
  - Contains computed SEO data
  - Populated by hooks
  - Not visible in admin interface

## Access Control

- **Read**: Public (anyone can read)
- **Create**: Authenticated users only
- **Update**: Authenticated users only
- **Delete**: Authenticated users only

## Hooks

The Posts collection includes several hooks for automatic processing:

### beforeValidate
- Auto-generates slug from title if not provided
- Runs on create operations

### beforeChange
- Computes metadata (reading time, word count)
- Updates dateModified timestamp
- Processes SEO data
- Generates performance hints

### afterChange
- Builds complete metadata
- Generates JSON-LD structured data
- Merges SEO data with site defaults
- Updates search indexes

### beforeRead & afterRead
- Enhances post data before/after reading
- Adds computed fields
- Applies site configuration defaults

## Performance Monitoring

All hooks include performance monitoring and error tracking for optimal system performance.

## Related Collections

- **users** - For author relationships
- **tags** - For post tagging
- **categories** - For post categorization
- **media** - For images and file uploads

## Admin Interface Features

- **Preview**: Available with preview URL generation
- **Default Columns**: title, status, datePublished, author
- **Pagination**: 20 items per page
- **Versioning**: Up to 10 versions per document
- **Drafts**: Full draft support with preview