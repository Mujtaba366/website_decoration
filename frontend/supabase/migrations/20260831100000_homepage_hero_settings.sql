/*
# Homepage hero content editable from site_settings

Extends the site_settings singleton with the three pieces of homepage hero
copy (eyebrow label, heading, subheading) that were previously hardcoded in
frontend/app/page.tsx. Defaults are set to the exact existing copy so the
public homepage is visually unchanged until an admin edits them from
/admin/settings.

Additive only - no existing column is altered or dropped.
*/

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_eyebrow text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_heading text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_subheading text;

UPDATE site_settings SET
  hero_eyebrow = COALESCE(hero_eyebrow, 'Auckland Wedding Decorations'),
  hero_heading = COALESCE(hero_heading, 'Beautiful spaces for your perfect day'),
  hero_subheading = COALESCE(hero_subheading, 'Stunning floral arches, backdrops, and table settings for rent. Personalized keepsakes for your wedding. We set it up — you say "I do."')
WHERE id = 1;
