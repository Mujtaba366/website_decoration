/*
# How It Works page hero editable from site_settings

Same pattern as the homepage hero and About page migrations: extends the
site_settings singleton with how_it_works_heading/how_it_works_subheading,
defaulted to the exact copy that was hardcoded in
frontend/app/how-it-works/page.tsx, so the public page is visually
unchanged until an admin edits it from /admin/settings.

Deliberately left the 4-step process list and the 3 info cards
(Outside Auckland / Prefer to Pick Up / Payment Options) on the same page
hardcoded - same reasoning as round two's About page migration: one
substantial editable block per page rather than a full page-builder.

Additive only - no existing column is altered or dropped.
*/

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS how_it_works_heading text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS how_it_works_subheading text;

UPDATE site_settings SET
  how_it_works_heading = COALESCE(how_it_works_heading, 'How It Works'),
  how_it_works_subheading = COALESCE(how_it_works_subheading, 'Renting decorations should be simple. Here''s our straightforward process.')
WHERE id = 1;
