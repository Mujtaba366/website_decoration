/*
# Create schema for wedding decoration rental + shop business

1. Purpose
- A 2-person Auckland wedding decoration business rents out decoration items
  (arches, backdrops, benches, florals) and sells wedding shop items
  (personalized glasses, etc.). This migration creates the full data model.

2. New Tables
- `products` — catalog of both rental and sale items.
  - id, name, slug, description, type ('rental' | 'sale'), category,
    base_price (numeric), images (text[]), personalization_label (nullable,
    for shop items like "name on glass"), active (bool), created_at.
- `rental_availability` — per-date availability for rental products.
  - id, product_id (fk products), date (date), is_available (bool),
    booking_id (nullable fk bookings).
- `bookings` — rental reservations/enquiries.
  - id, product_id (fk products), customer_name, contact, event_date (date),
    fulfillment_type ('setup' | 'pickup'), address (nullable),
    is_within_auckland (bool, nullable), extra_fee (numeric, nullable),
    status ('enquiry' | 'confirmed' | 'paid' | 'completed'),
    message (nullable), created_at.
- `orders` — shop item purchases.
  - id, customer_name, contact, items (jsonb array of {product_id, qty,
    personalization}), total (numeric), payment_method, status, created_at.
- `messages` — customer enquiries/messages tied to a product or booking.
  - id, product_id (nullable fk products), booking_id (nullable fk bookings),
    sender_name, content, created_at.
- `payments` — payment records for orders or bookings.
  - id, order_id (nullable fk orders), booking_id (nullable fk bookings),
    method ('stripe' | 'bank_transfer' | 'afterpay'), amount (numeric),
    status ('pending' | 'paid' | 'failed'), created_at.

3. Security
- This is a public storefront with no sign-in. All tables use
  TO anon, authenticated with USING (true) / WITH CHECK (true) because the
  data is intentionally public/shared (catalog, bookings, orders, messages
  are all created by anonymous site visitors).

4. Notes
- Auckland boundary check is done in the frontend; is_within_auckland is
  stored as a boolean on the booking for record-keeping.
- extra_fee is nullable so out-of-Auckland bookings can be created as
  'enquiry' with extra_fee: null until manually confirmed.
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'rental' CHECK (type IN ('rental', 'sale')),
  category text,
  base_price numeric(10, 2) NOT NULL DEFAULT 0,
  images text[] DEFAULT '{}',
  personalization_label text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  contact text NOT NULL,
  event_date date NOT NULL,
  fulfillment_type text NOT NULL DEFAULT 'pickup' CHECK (fulfillment_type IN ('setup', 'pickup')),
  address text,
  is_within_auckland boolean,
  extra_fee numeric(10, 2),
  status text NOT NULL DEFAULT 'enquiry' CHECK (status IN ('enquiry', 'confirmed', 'paid', 'completed')),
  message text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rental_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  UNIQUE (product_id, date)
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  contact text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  total numeric(10, 2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'stripe',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'fulfilled', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  sender_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  method text NOT NULL DEFAULT 'stripe' CHECK (method IN ('stripe', 'bank_transfer', 'afterpay')),
  amount numeric(10, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- products: public read, public insert/update (admin adds products via form)
DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

-- bookings: public read + insert (customers create bookings)
DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
CREATE POLICY "anon_select_bookings" ON bookings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
CREATE POLICY "anon_update_bookings" ON bookings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;
CREATE POLICY "anon_delete_bookings" ON bookings FOR DELETE
  TO anon, authenticated USING (true);

-- rental_availability: public read + insert + update + delete
DROP POLICY IF EXISTS "anon_select_rental_availability" ON rental_availability;
CREATE POLICY "anon_select_rental_availability" ON rental_availability FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_rental_availability" ON rental_availability;
CREATE POLICY "anon_insert_rental_availability" ON rental_availability FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_rental_availability" ON rental_availability;
CREATE POLICY "anon_update_rental_availability" ON rental_availability FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_rental_availability" ON rental_availability;
CREATE POLICY "anon_delete_rental_availability" ON rental_availability FOR DELETE
  TO anon, authenticated USING (true);

-- orders: public read + insert + update
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);

-- messages: public read + insert
DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "anon_select_messages" ON messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_messages" ON messages;
CREATE POLICY "anon_delete_messages" ON messages FOR DELETE
  TO anon, authenticated USING (true);

-- payments: public read + insert + update
DROP POLICY IF EXISTS "anon_select_payments" ON payments;
CREATE POLICY "anon_select_payments" ON payments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_payments" ON payments;
CREATE POLICY "anon_update_payments" ON payments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_rental_availability_product_date ON rental_availability(product_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_product_id ON bookings(product_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_messages_product_id ON messages(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON messages(booking_id);
