/*
# Global rental calendar, configurable delivery options, site settings

1. New Tables
- `blocked_dates` — global calendar of unavailable dates, shared across all
  rental products (one operator does all deliveries, so a booked date blocks
  every item, not just one product).
  - id, date (unique), reason (nullable, e.g. a manual note or the auto text
    for a booking), booking_id (nullable fk bookings), created_at.
- `delivery_options` — admin-configurable list of fulfillment choices shown
  on the booking form (replaces the two hardcoded "setup"/"pickup" radios).
  - id, label, description, fee, is_default, active, sort_order, created_at.
  Soft-delete via `active = false` — never hard-deleted so past bookings
  keep a valid `delivery_option_id` reference.
- `site_settings` — singleton row (id fixed at 1) holding editable site-wide
  copy: site_name, tagline, support_email, phone, location, logo_url,
  instagram_handle, service_area_note.

2. Changes to existing tables
- `bookings.delivery_option_id` (nullable fk delivery_options) added so a
  booking can reference a specific configurable delivery option.
- `bookings.fulfillment_type`'s CHECK constraint (limited to exactly
  'setup'/'pickup') is dropped so it's no longer stuck at two hardcoded
  values; the column is kept for backward compatibility as a human-readable
  mirror of the chosen delivery option's label.

3. Security
- Same permissive pattern as the rest of this schema: RLS enabled with
  `TO anon, authenticated USING (true)` policies. The backend talks to
  Supabase with the anon key throughout; real access control for admin
  writes happens in the Flask layer via the admin bearer token, not RLS.
*/

CREATE TABLE IF NOT EXISTS blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  reason text,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_blocked_dates" ON blocked_dates;
CREATE POLICY "anon_select_blocked_dates" ON blocked_dates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_blocked_dates" ON blocked_dates;
CREATE POLICY "anon_insert_blocked_dates" ON blocked_dates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_blocked_dates" ON blocked_dates;
CREATE POLICY "anon_update_blocked_dates" ON blocked_dates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_blocked_dates" ON blocked_dates;
CREATE POLICY "anon_delete_blocked_dates" ON blocked_dates FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON blocked_dates(date);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_booking_id ON blocked_dates(booking_id);

CREATE TABLE IF NOT EXISTS delivery_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  description text,
  fee numeric(10, 2) NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_delivery_options" ON delivery_options;
CREATE POLICY "anon_select_delivery_options" ON delivery_options FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_delivery_options" ON delivery_options;
CREATE POLICY "anon_insert_delivery_options" ON delivery_options FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_delivery_options" ON delivery_options;
CREATE POLICY "anon_update_delivery_options" ON delivery_options FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_delivery_options" ON delivery_options;
CREATE POLICY "anon_delete_delivery_options" ON delivery_options FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO delivery_options (label, description, fee, is_default, active, sort_order)
SELECT 'We set it up', 'We deliver, set up, and dismantle within Auckland. Included in the rental price.', 0, true, true, 0
WHERE NOT EXISTS (SELECT 1 FROM delivery_options);

INSERT INTO delivery_options (label, description, fee, is_default, active, sort_order)
SELECT 'I''ll pick it up & set it up myself', 'Pick up from our Auckland storage. We''ll arrange a pickup time with you.', 0, false, true, 1
WHERE NOT EXISTS (SELECT 1 FROM delivery_options WHERE label = 'I''ll pick it up & set it up myself');

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_option_id uuid REFERENCES delivery_options(id) ON DELETE SET NULL;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_fulfillment_type_check;

CREATE INDEX IF NOT EXISTS idx_bookings_delivery_option_id ON bookings(delivery_option_id);

CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY DEFAULT 1,
  site_name text NOT NULL DEFAULT 'Bloom & Vow',
  tagline text,
  support_email text,
  phone text,
  location text,
  logo_url text,
  instagram_handle text,
  service_area_note text,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_site_settings" ON site_settings;
CREATE POLICY "anon_select_site_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_site_settings" ON site_settings;
CREATE POLICY "anon_insert_site_settings" ON site_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_site_settings" ON site_settings;
CREATE POLICY "anon_update_site_settings" ON site_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO site_settings (id, site_name, tagline, support_email, phone, location, instagram_handle, service_area_note)
VALUES (
  1,
  'Bloom & Vow',
  'Wedding decoration rentals and personalized keepsakes for couples across Auckland.',
  'hello@bloomandvow.co.nz',
  '021 123 4567',
  'Auckland, New Zealand',
  '@bloomandvow',
  'We deliver and set up across Auckland, or you can pick it up yourself.'
)
ON CONFLICT (id) DO NOTHING;
