Here’s a ready-to-use build prompt for **trae.ai** that will create a “Generate SEO” action for your Payload CMS **posts** collection. It adds a sidebar button that, when clicked, sends the current post’s **title** and **content** to ChatGPT and then **populates every other field** (without touching Title, Slug, or Content). It follows SEO best practices, outputs strongly-typed JSON, and only updates what’s empty unless “force overwrite” is enabled.

---

# Trae.ai Build Prompt — “Payload Post SEO Autofill”

## Goal

Create an admin-side action for Payload CMS (collection `posts`) named **Generate SEO**. When clicked, it:

1. Reads the current document’s **title** and **content** (only these are inputs to the LLM).
2. Uses ChatGPT to produce SEO, OG/Twitter, JSON-LD, and metadata.
3. Writes back to the document, **not modifying** `title`, `slug`, or `content`.

## Where it appears

- Add a **sidebar button** labeled **“Generate SEO”** on the `posts` collection edit view, near the “SEO Overrides” group.
- Optional: include a toggle **“Force overwrite existing values”** (default: off).

## Data model (Payload posts collection)

Use the user’s provided schema. Do **not** change the schema. Only update these fields when the action runs:

- `excerpt` (text)
- `featuredImage` (leave as is; do not change)
- `author` (leave as is; do not change)
- `tags`, `categories` (relationship IDs required → **leave untouched**; see note below)
- `datePublished` (set only if empty and status === "published")
- `dateModified` (always set to now)
- `status` (leave untouched)
- `metadata.readingTime` (number, minutes)
- `metadata.wordCount` (number)
- `metadata.lastModified` (date)
- `seo.pageTitle`
- `seo.metaDescription`
- `seo.metaKeywords`
- `seo.canonicalURL`
- `openGraph.ogTitle`
- `openGraph.ogDescription`
- `openGraph.ogImage` (leave blank unless we decide to copy featuredImage; default: leave as is)
- `twitter.twitterTitle`
- `twitter.twitterDescription`
- `twitter.twitterImage` (leave as is)
- `jsonld.headline`
- `jsonld.schemaDescription`
- `jsonld.wordCount` (mirror of metadata.wordCount)
- `seoComputed` (json; hidden) — store a quality report summary object here.

> **Note on tags/categories:** These are relationships needing IDs. Since we’re not querying the taxonomy collections here, **do not** modify them. (Future enhancement could map generated keywords → existing tag IDs.)

## Action logic

- **Inputs pulled from current document**: `title`, `content`, `slug?`, `featuredImage?`, `author?`, `status`, `datePublished?`
- **Env / site context (configure in Trae variables)**:
  - `SITE_NAME`
  - `SITE_URL` (e.g., `https://example.com`)

- **Derived values**:
  - `postUrl` = `${SITE_URL}/posts/${slug || generatedSlug}`
  - `nowIso` = current timestamp in ISO

- **Rules**:
  - Never alter `title`, `slug`, `content`.
  - If `status` is `"published"` and `datePublished` is empty, set `datePublished = nowIso`. Otherwise leave.
  - Always set `dateModified = nowIso` and `metadata.lastModified = nowIso`.
  - Compute `wordCount` from **rendered plain text** of `content`. `readingTime = ceil(wordCount / 200)`.
  - Only set/overwrite other fields if they are empty **unless** “Force overwrite” is toggled on.

## OpenAI (ChatGPT) call

- **Model**: GPT-4.1/4o/5-level model (use your best/available; must follow JSON schema strictly).
- **Temperature**: 0.3
- **Max tokens**: Sized to fit rich descriptions but keep within safe limits.
- **Output format**: **strict JSON** (no markdown, no commentary).

### LLM System Prompt

```
You are an expert technical SEO specialist and content strategist.
You must output ONLY valid JSON as specified by the provided JSON schema.
Do not include any text outside of the JSON.
Follow modern SEO best practices (2025): INP-first performance awareness, E-E-A-T tone guidelines, precise metadata, and clean JSON-LD.
Respect character limits and avoid keyword stuffing. Keep language natural and high quality.
```

### LLM User Prompt Template (fill placeholders with current doc/site values)

```
Generate SEO fields for a blog post. Use ONLY the title and content below.
Do not invent facts.
If some site/post info is missing, make sensible, non-fantastical defaults or leave fields empty as instructed.

Site context:
- siteName: {{SITE_NAME}}
- siteUrl: {{SITE_URL}}
- postUrl: {{postUrl}}
- featuredImageUrl (optional): {{featuredImageUrl_or_empty}}
- authorName (optional): {{authorName_or_empty}}
- nowIso: {{nowIso}}

Inputs:
- title: {{title}}
- content (HTML or rich text → treat as rendered plain text for summaries and counts):
{{content_plaintext}}

Your tasks:
1) Create a compelling, human-sounding **excerpt** (20–40 words). No emojis, no hashtags.
2) Create an SEO **metaDescription** that is highly relevant to the page (150–160 chars). No trailing ellipses unless necessary.
3) Generate **metaKeywords**: between **3 and 8** comma-separated keywords, all lowercase, highly relevant; avoid duplicates, brand names unless in title; no stuffing.
4) Produce a **pageTitle** (<= 60 chars) that improves CTR, keeps the main topic, and reads naturally. Prefer title case.
5) Set **canonicalURL** = {{postUrl}} exactly.
6) Create Open Graph:
   - ogTitle (<= 60 chars; can match pageTitle or close variant)
   - ogDescription (110–200 chars; persuasive, not spammy)
   - Leave ogImage empty (we won’t set images here).
7) Create Twitter equivalents:
   - twitterTitle (<= 70 chars)
   - twitterDescription (110–200 chars)
   - Leave twitterImage empty.
8) Create JSON-LD (BlogPosting):
   - headline (<= 110 chars; can match pageTitle)
   - description (match metaDescription, or a close semantically equivalent variant)
   - wordCount (integer, count words from provided content)
   - datePublished (ISO; if unknown, leave empty string "")
   - dateModified (ISO; set to {{nowIso}})
   - author.name (if provided; else empty string "")
   - mainEntityOfPage.@id = {{postUrl}}
   - publisher.name = {{SITE_NAME}}
   - image (array) — if featuredImageUrl provided, include it as the sole item; else empty array.
   Ensure valid Schema.org BlogPosting (https://schema.org/BlogPosting).

9) Provide a **qualityReport** object for internal use (seoComputed):
   - titleLength, metaDescriptionLength, ogDescriptionLength, twitterDescriptionLength
   - keywordCount
   - checks:
       { hasPrimaryTopic:boolean, noKeywordStuffing:boolean, naturalTone:boolean, uniqueVsTitle:boolean, withinCharLimits:boolean }
   - suggestions: short array (<=5) of actionable improvements.

Respect all limits. Output MUST match this JSON schema exactly.
```

### Required JSON Output Schema (what the model must return)

```
{
  "excerpt": "string (20-40 words)",
  "seo": {
    "pageTitle": "string (<=60 chars)",
    "metaDescription": "string (150-160 chars)",
    "metaKeywords": "string (3-8 comma-separated, lowercase, no extra spaces)",
    "canonicalURL": "string (absolute URL)"
  },
  "openGraph": {
    "ogTitle": "string (<=60 chars)",
    "ogDescription": "string (110-200 chars)"
  },
  "twitter": {
    "twitterTitle": "string (<=70 chars)",
    "twitterDescription": "string (110-200 chars)"
  },
  "jsonld": {
    "headline": "string (<=110 chars)",
    "schemaDescription": "string (≈ metaDescription)",
    "wordCount": 123,
    "datePublished": "string ISO or empty",
    "dateModified": "string ISO",
    "authorName": "string or empty",
    "image": ["absolute URL"]  // or []
  },
  "qualityReport": {
    "titleLength": 0,
    "metaDescriptionLength": 0,
    "ogDescriptionLength": 0,
    "twitterDescriptionLength": 0,
    "keywordCount": 0,
    "checks": {
      "hasPrimaryTopic": true,
      "noKeywordStuffing": true,
      "naturalTone": true,
      "uniqueVsTitle": true,
      "withinCharLimits": true
    },
    "suggestions": ["string", "string"]
  }
}
```

## Trae.ai Steps

1. **UI Action**
   - Add button “Generate SEO” and a checkbox “Force overwrite existing values”.
   - On click, read current document fields and site variables.

2. **Preprocess**
   - Convert `content` to plain text (strip HTML/rich text nodes).
   - Compute `wordCount` locally to be used in readingTime and to cross-check LLM output.
   - Build `postUrl` from site base URL + slug (if slug missing, still pass an inferred URL but do **not** write slug).

3. **LLM Call**
   - Use the System + User prompts above, populate placeholders.
   - Parse the JSON response. If parsing fails, re-ask the model once to return **valid JSON only**.

4. **Validation**
   - Ensure all string length limits are respected; trim if slightly over.
   - `metaKeywords`: split by comma, trim each, ensure 3–8 items, dedupe.
   - `canonicalURL` must equal `postUrl`.
   - `jsonld.wordCount` should match local ±10% tolerance; if wildly off, replace with local.
   - If `featuredImage` exists and has a public URL, you may pass it as `featuredImageUrl`; otherwise jsonld.image should be `[]`.

5. **Mapping to Payload fields**
   - If “Force overwrite” is **off**: only write to a field when the field is empty.
   - If “Force overwrite” is **on**: overwrite all target fields below.
   - Writes:
     - `excerpt` ← output.excerpt
     - `seo.pageTitle` ← output.seo.pageTitle
     - `seo.metaDescription` ← output.seo.metaDescription
     - `seo.metaKeywords` ← output.seo.metaKeywords
     - `seo.canonicalURL` ← output.seo.canonicalURL
     - `openGraph.ogTitle` ← output.openGraph.ogTitle
     - `openGraph.ogDescription` ← output.openGraph.ogDescription
     - `twitter.twitterTitle` ← output.twitter.twitterTitle
     - `twitter.twitterDescription` ← output.twitter.twitterDescription
     - `jsonld.headline` ← output.jsonld.headline
     - `jsonld.schemaDescription` ← output.jsonld.schemaDescription
     - `jsonld.wordCount` ← localWordCount
     - `metadata.wordCount` ← localWordCount
     - `metadata.readingTime` ← ceil(localWordCount / 200)
     - `metadata.lastModified` ← nowIso
     - `dateModified` ← nowIso
     - `datePublished` ← if empty AND status === "published" then nowIso else leave
     - `seoComputed` ← entire `qualityReport` object from output (plus a `modelVersion` string and a `generatedAt` timestamp)

6. **Do NOT modify**
   - `title`, `slug`, `content`
   - `featuredImage`, `author`, `tags`, `categories`, `status`, `openGraph.ogImage`, `twitter.twitterImage`

7. **Success/Errors**
   - On success: toast “SEO generated and fields updated.”
   - On partial validation corrections: toast “SEO generated with minor adjustments (length/keywords).”
   - On failure: show a readable error; do not write any changes.

## Example `seoComputed` structure

```
{
  "generatedAt": "{{nowIso}}",
  "modelVersion": "gpt-x",
  "report": {
    "titleLength": 54,
    "metaDescriptionLength": 156,
    "ogDescriptionLength": 145,
    "twitterDescriptionLength": 138,
    "keywordCount": 5,
    "checks": {
      "hasPrimaryTopic": true,
      "noKeywordStuffing": true,
      "naturalTone": true,
      "uniqueVsTitle": true,
      "withinCharLimits": true
    },
    "suggestions": [
      "Consider adding a statistic in the intro.",
      "Add an internal link to your services page."
    ]
  }
}
```

## Security & Rate Limits

- Never send unpublished/private data beyond what’s required (title, content, basic context).
- Strip PII.
- Add minimal retry logic for transient failures; max 1 retry.

## Testing Cases

- Post with short content: still produce valid meta; avoid generic fluff.
- Post with existing SEO overrides: confirm “Force overwrite” behavior.
- Post marked `published` with empty `datePublished`: ensure it’s set.

---

If you want, I can also provide a minimal **Payload admin UI snippet** to render the button and call this action, or a ready-made **serverless function** template that Trae can deploy and your Payload admin can invoke.
