# Content Plans — Purpose, Flow, and Data Model

Content Plans let you quickly draft an editorial calendar, review AI‑generated ideas, and materialize approved items into Posts with planned publish dates. They live in the `contentPlans` collection and are designed for teams who need structure and speed when planning content.

---

## What Content Plans Are
- A plan contains overall strategy details (topic, audience, duration) and an array of dated “items”.
- Items are proposed pieces of content (title, slug, description, keywords) for specific days.
- Approved items can be materialized into real `posts` in one action; the plan tracks which post was created for each item.

## Why Use Them
- Accelerates content ideation via AI while keeping human review and approval.
- Enforces scheduling discipline (start/end dates, number of days).
- Prevents “idea debt” by turning approved items into published assets with one click/endpoint.

---

## Data Model (Collection: `contentPlans`)
- `owner` — relationship to `users`; set automatically on create if the requester is authenticated.
- `status` — select: `draft`, `generated`, `approved`, `archived`; used to track progress.
- `topic` — text; the theme for the plan.
- `audience` — text; who the plan targets.
- `days` — number; total length of the plan (default 30).
- `startDate` — date; the first day of the plan.
- `endDate` — date; computed from `startDate + (days - 1)`.
- `strategyNotes` — textarea; notes, framing, and goals.
- `items` — array of objects:
  - `date` — date; when the item is intended to publish.
  - `title` — text; working headline.
  - `slug` — text; suggested slug.
  - `description` — textarea; synopsis of the piece.
  - `keywords` — array of `{ value: string }` for SEO.
  - `approved` — checkbox; mark this item ready to materialize.
  - `postId` — relationship to `posts`; set after materialization.

Admin UI
- Appears under group `AI` with default columns: `topic`, `status`, `days`, `startDate`, `owner`.
- All CRUD actions require an authenticated user (`req.user`).

---

## Workflow
1. Create or Generate
   - Create manually or call the generate endpoint to let AI propose items.
   - On `create`, `owner` is set from the authenticated user; `endDate` is auto‑computed.
2. Review & Approve
   - Edit titles/slugs/descriptions, add/remove keywords.
   - Toggle `approved` for items that should become Posts.
3. Materialize to Posts
   - Run the materialize endpoint to create posts for all approved items that don’t yet have a `postId`.
   - Each created Post receives `plannedPublishDate` from the item’s `date`.
   - The plan updates its items so `postId` points at the created Post.
4. Publish & Iterate
   - Use `plannedPublishDate` to schedule publishing.
   - Update status to `approved` or `archived` when the plan is complete.

---

## API Endpoints
All endpoints require authentication.

- POST `/api/contentPlans/generate`
  - Body example:
    ```json
    {
      "topic": "AI for small businesses",
      "audience": "SMB owners",
      "days": 14,
      "startDate": "2025-11-01T09:00:00.000Z",
      "strategyNotes": "Focus on practical tips and case studies"
    }
    ```
  - Behavior:
    - Calls OpenAI to generate `items` with suggested dates/titles/slugs/descriptions/keywords.
    - Creates a `contentPlans` document with `status: generated`.

- POST `/api/contentPlans/:id/materialize`
  - Body example:
    ```json
    { "asDraft": true }
    ```
  - Behavior:
    - For each `items[i]` where `approved === true` and `postId` is empty:
      - Creates a `posts` document with `plannedPublishDate` set from `items[i].date`.
      - Updates `items[i].postId` with the new post’s ID.

---

## Database Schema
Content Plans use Payload’s snake_case table naming. The schema fix ensures consistent names and indexes:

- `content_plans`
  - Columns: `id`, `updated_at`, `created_at`, `owner_id`, `status`, `topic`, `audience`, `days`, `start_date`, `end_date`, `strategy_notes`
  - Indexes: `content_plans_status_idx`, `content_plans_owner_idx`

- `content_plans_items`
  - Columns: `id`, `_parent_id`, `_order`, `date`, `title`, `slug`, `description`, `approved`, `post_id`
  - Foreign key: `content_plans_items_parent_fk` → `content_plans(id)` ON DELETE CASCADE
  - Indexes: `content_plans_items_parent_idx`

- `content_plans_items_keywords`
  - Columns: `id`, `_parent_id`, `_order`, `value`
  - Foreign key: `content_plans_items_keywords_parent_fk` → `content_plans_items(id)` ON DELETE CASCADE

- `posts`
  - Column added: `planned_publish_date` (maps to Payload field `plannedPublishDate`).

- `payload_locked_documents_rels`
  - Column: `content_plans_id` with FK → `content_plans(id)`; plus columns for `tags_id`, `categories_id`, `personas_id`.

---

## Access & Security
- All read/create/update/delete operations check for an authenticated user (`req.user`).
- Generate and materialize endpoints are protected; return `403` when unauthenticated.

---

## Common Errors & Fixes
- “Failed query… relation \"content_plans\" does not exist”
  - Run `/api/fix-content-plans-schema` to create tables and indexes.
- “Server null” on admin pages
  - Usually a symptom of missing tables or mismatched FKs; run the schema fixes and restart the dev server.
- Dev build errors (Next.js chunks aborting)
  - Clear `.next` folder and restart `npm run dev`. Ensure only one dev server instance is needed.

---

## Tips & Future Enhancements
- Add persona targeting and link plan items to personas for deeper audience alignment.
- Enrich items with auto‑generated outlines or images.
- Add plan‑level rollups (approved count, materialized count, publish progress).
- Support bulk item approval and bulk materialization with dry‑run.

---

## Glossary
- Materialize — create actual `posts` from approved plan items.
- Planned Publish Date — scheduling field on `posts` populated from item `date`.
- Items — entries within a plan representing proposed content pieces for specific dates.