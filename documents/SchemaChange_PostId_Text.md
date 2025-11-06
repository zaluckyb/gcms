# Schema Change: `contentPlans_items.post_id` to TEXT

This change resolves PostgreSQL errors where alphanumeric identifiers (e.g., `6908ef717bf771ac68af20fa`) were being written to an `INTEGER` column, causing `22P02 invalid input syntax for type integer`.

## Summary
- Alter `contentPlans_items.post_id` from `INTEGER` to `TEXT`.
- Add index `contentPlans_items_post_id_idx` on the `post_id` column.
- Update server logic to store `post` as a string and validate accepted formats.

## Migration
- Up: change type to `TEXT` and create index.
- Down: convert back to `INTEGER`, non-numeric values become `NULL`.

## API and Code Updates
- `POST /api/contentPlans/:id/save-generated` now accepts `post` as string and persists as text.
- `beforeChange` hook sanitizes `items[]` to ensure `post` is a string matching one of:
  - Digits-only (`^[0-9]+$`)
  - 24-char hex (`^[0-9a-f]{24}$`)
  - General slug-ish (`^[A-Za-z0-9_-]{1,128}$`)
  Invalid values are set to `null` during save.

## Backward Compatibility
- Existing numeric IDs continue to work; they are stored as strings.
- Linking to `posts` uses numeric IDs when present; non-numeric external IDs are preserved but not dereferenced as relationships.

## Verification
1. Save a Content Plan with `items[].post = "6908ef717bf771ac68af20fa"`.
2. Confirm no `22P02` errors in server logs and the save succeeds.
3. Confirm any downstream publishing/linking uses string IDs when applicable.

## Notes
- The Admin field remains read-only. Relationship resolution for non-numeric IDs is intentionally skipped.
- To mirror `itemsJson` on each save, set `SYNC_ITEMS_JSON_ON_SAVE=true` or send header `x-sync-items-json: 1`.