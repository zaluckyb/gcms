# Frontend Posts Layout (Tailwind + Payload)

This document explains every file and element that makes up the dynamic frontend Post page. The page reads data directly from your Payload `posts` collection and renders it with Tailwind CSS.

## Files & Locations

- `src/app/(frontend)/posts/page.tsx`
  - Posts index page. Lists posts from Payload and links to each post detail page.
- `src/app/(frontend)/posts/[id]/page.tsx`
  - Dynamic post detail page. Fetches a single post by `id` from Payload and renders it.
- `src/app/(frontend)/layout.tsx`
  - Frontend layout that imports global styles and wraps all frontend pages.
- `src/app/(frontend)/styles.css`
  - Global CSS for the frontend. Includes Tailwind directives and any custom styles.
- `tailwind.config.js`
  - Tailwind configuration with `content` paths pointing at `src/app/**/*` and `src/components/**/*`.
- `postcss.config.js`
  - PostCSS configuration enabling Tailwind and Autoprefixer.
- `src/payload.config.ts`
  - Payload configuration used by the Next.js app to retrieve data.

## Data Model Mapping (Payload → Frontend)

The frontend post page uses the following fields from your `posts` collection (defined in `src/collections/Posts.ts`):

- `headline` → Rendered as the main post title.
- `description` → Rendered as the short summary under the title.
- `datePublished` → Shown as the formatted published date.
- `author` (relationship to `users`) → Displays author name/email if available.
- `image` (relationship to `media`) → Renders a banner image when present.
- `keywords` (array of text) → Rendered as tag pills.
- `articleBody` (Lexical `richText`) → Rendered via `@payloadcms/richtext-lexical/react`.

Additional fields from the schema can be added as needed (e.g., `url`, `commentCount`, etc.).

## How Data Is Fetched

- The pages use `getPayload` together with your `payload.config` to read the database directly.
- Index page: `payload.find({ collection: 'posts', limit: <n>, where: { _status: { equals: 'published' } } })`.
- Detail page: `payload.findByID({ collection: 'posts', id })`.

You can toggle draft-mode rendering per your needs (e.g., show drafts to authenticated users).

## Rendering Rich Text

- The `articleBody` field is a Lexical document stored as JSON.
- It is rendered in the frontend using `@payloadcms/richtext-lexical/react` (`<RichText data={post.articleBody} />`).
- This avoids manual HTML serialization and ensures your content renders safely.

## Tailwind Usage

- Tailwind is enabled by adding `@tailwind base; @tailwind components; @tailwind utilities;` at the top of `src/app/(frontend)/styles.css`.
- Components and pages use Tailwind utility classes (e.g., `container`, `mx-auto`, `prose`, `text-gray-700`, `bg-gray-50`, etc.).
- The `prose` class (if using `@tailwindcss/typography`) can be added later for rich text styling; currently standard utilities are used.

## Page Composition (Detail Page)

- Wrapper: `container mx-auto max-w-3xl px-4 py-8`
- Title: `text-3xl font-bold tracking-tight`
- Meta: author + date: `text-sm text-gray-500`
- Tags: `flex gap-2 mt-4` with tags styled as `inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600`
- Banner image: full-width image with `rounded-lg shadow`
- Body: rich text container with `mt-8 text-gray-800`

## Page Composition (Index Page)

- Wrapper: `container mx-auto max-w-4xl px-4 py-8`
- List: grid or stack with card links to `/posts/<id>`
- Card: title (`headline`), summary (`description`), meta (author + date), and optional thumbnail (`image`).

## How To Run & Preview

- Start dev server: `npm run dev`.
- Index page: open `http://localhost:3000/posts` (or `http://localhost:3001/posts` if port 3000 is busy).
- Detail page: open `http://localhost:3000/posts/<id>` (replace `<id>` with a real ID from the admin).

## Extending

- Add a `slug` field to `posts` for SEO-friendly URLs and change the dynamic route to `[slug]`.
- Handle draft content conditionally (e.g., show drafts to logged-in editors only).
- Add pagination and filtering on the index page (by `keywords`, `author`, `datePublished`).
- Add comments rendering if you later populate the `comments` array.

## Notes

- Images are rendered using `<img>` to avoid Next Image domain configuration. You can switch to `next/image` and configure allowed domains in `next.config.mjs`.
- If you modify `posts` fields, regenerate types with `npm run generate:types` and adapt the frontend accordingly.