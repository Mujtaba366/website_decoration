# Supabase Schema - Decoration Rental & Wedding Shop

## Tables to Create

### 1. products
```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  type text not null check (type in ('rental', 'sale')),
  category text not null,
  base_price decimal(10, 2) not null,
  images jsonb default '[]'::jsonb,
  active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

### 2. rental_availability
```sql
create table rental_availability (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  date date not null,
  is_available boolean default true,
  booking_id uuid,
  created_at timestamp default now()
);

create index idx_rental_availability_product_date on rental_availability(product_id, date);
```

### 3. bookings (Rental Bookings)
```sql
create table bookings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  event_date date not null,
  fulfillment_type text not null check (fulfillment_type in ('setup', 'pickup')),
  address text,
  is_within_auckland boolean,
  extra_fee decimal(10, 2) default 0,
  message text,
  status text default 'enquiry' check (status in ('enquiry', 'confirmed', 'paid', 'completed', 'cancelled')),
  payment_method text,
  payment_id uuid references payments(id),
  total_amount decimal(10, 2),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index idx_bookings_product_date on bookings(product_id, event_date);
create index idx_bookings_status on bookings(status);
```

### 4. orders (Shop Orders)
```sql
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  items jsonb not null,
  total_amount decimal(10, 2) not null,
  payment_method text,
  payment_id uuid references payments(id),
  status text default 'pending' check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  shipping_address jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index idx_orders_status on orders(status);
```

### 5. messages
```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  related_to uuid not null,
  related_type text not null check (related_type in ('product', 'booking', 'order')),
  sender_name text not null,
  sender_email text not null,
  content text not null,
  created_at timestamp default now()
);

create index idx_messages_related_to on messages(related_to);
```

### 6. payments
```sql
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  booking_id uuid references bookings(id) on delete cascade,
  method text not null check (method in ('stripe', 'bank_transfer', 'afterpay')),
  amount decimal(10, 2) not null,
  status text default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_id text,
  stripe_client_secret text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index idx_payments_status on payments(status);
```

## Required Setup Steps

1. Go to Supabase Dashboard for your project
2. Go to SQL Editor
3. Run each CREATE TABLE statement above
4. Enable Row Level Security (RLS) if needed - for now, disable it for development (uncheck "Enable RLS" on each table)
5. Note your Supabase URL and Anon Key for .env files

## Mock Data Queries

### Insert sample products
```sql
-- Rental Product
insert into products (name, slug, description, type, category, base_price, images, active)
values 
  ('White Flower Arch', 'white-flower-arch', 'Beautiful white flower arch setup', 'rental', 'Arches', 250.00, '["arch1.jpg", "arch2.jpg"]'::jsonb, true),
  ('Round Backdrop Gold', 'round-backdrop-gold', 'Elegant gold round backdrop', 'rental', 'Backdrops', 350.00, '["backdrop1.jpg"]'::jsonb, true);

-- Shop Product
insert into products (name, slug, description, type, category, base_price, images, active)
values
  ('Personalized Wedding Glasses', 'personalized-wedding-glasses', 'Custom engraved wedding glasses set', 'sale', 'Glassware', 45.00, '["glasses1.jpg"]'::jsonb, true),
  ('Monogrammed Napkins', 'monogrammed-napkins', 'Set of 50 personalized napkins', 'sale', 'Table Settings', 25.00, '["napkins1.jpg"]'::jsonb, true);

-- Add availability for rentals (next 90 days)
-- Run this to add daily availability
with dates as (
  select generate_series(current_date, current_date + interval '90 days', interval '1 day')::date as date
)
insert into rental_availability (product_id, date, is_available)
select (select id from products where slug = 'white-flower-arch'), date, true
from dates;
```

## Notes
- Rental bookings are tied to specific dates
- Shop items are inventory-based (consider adding quantity field if needed)
- Auckland boundary check happens in backend based on address
- Payments are tracked separately for both rental bookings and shop orders
