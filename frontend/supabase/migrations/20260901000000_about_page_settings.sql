/*
# About page content editable from site_settings

Same pattern as the homepage hero migration: extends the site_settings
singleton with about_heading/about_subheading/about_story, defaulted to the
exact copy that was hardcoded in frontend/app/about/page.tsx, so the public
page is visually unchanged until an admin edits it from /admin/settings.

about_story holds all three story paragraphs as one text field, separated by
blank lines (\n\n) - the About page splits on that to render each as its own
<p>. Deliberately not broken into separate columns per paragraph or
extended to the "Values" grid on the same page - kept to the single most
substantial editable block for now rather than turning this into a full
page-builder in one migration.

Additive only - no existing column is altered or dropped.
*/

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_heading text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_subheading text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_story text;

UPDATE site_settings SET
  about_heading = COALESCE(about_heading, 'Our Story'),
  about_subheading = COALESCE(about_subheading, 'A passion for beautiful weddings and creating unforgettable moments.'),
  about_story = COALESCE(about_story, E'Based right here in Auckland, what started as helping a friend style their wedding venue turned into a full-blown obsession with creating beautiful spaces for couples on their big day.\n\nWe know firsthand how stressful wedding planning can be. There''s the budget, the timeline, the endless decisions. That''s why we keep things simple: beautiful decorations, fair prices, and we handle the heavy lifting — literally. You pick what you love, we set it up, and you walk into a venue that takes your breath away.\n\nEvery piece in our collection has been hand-picked and styled with care. We''re not a big rental warehouse — we care about every single booking. When you rent from us, you''re not just getting decorations. You''re getting our time, our attention, and our promise that your venue will look exactly how you imagined it.')
WHERE id = 1;
