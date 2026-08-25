# Admin Guide - Managing Your Rental & Shop Business

## Add New Products

### Via Supabase Dashboard (Easiest)

1. Log in to your Supabase project
2. Go to **SQL Editor** or **Table Editor** (left sidebar)
3. Select **products** table

#### For Rental Products:

Click **Insert Row** and fill:
- **name**: e.g., "White Flower Arch"
- **slug**: e.g., "white-flower-arch" (lowercase, hyphens, no spaces)
- **description**: "Beautiful white flower arch perfect for ceremonies"
- **type**: Select "rental"
- **category**: Select from: Arches, Backdrops, Benches, Florals, Table Settings
- **base_price**: 250
- **images**: `["arch-photo.jpg"]` (JSON array of image URLs)
- **active**: true

#### For Shop Products:

- **type**: Select "sale"
- **category**: Select from: Glassware, Table Settings, Favors, Signage

### Add Rental Availability

Once a rental product is created, add 90 days of availability:

```sql
WITH dates AS (
  SELECT generate_series(current_date, current_date + interval '90 days', interval '1 day')::date as date
)
INSERT INTO rental_availability (product_id, date, is_available)
SELECT (SELECT id FROM products WHERE slug = 'your-product-slug'), date, true
FROM dates;
```

Replace `your-product-slug` with your product's slug.

## View Bookings (Rentals)

Go to **bookings** table in Supabase:

Each row shows:
- **customer_name**: Who's booking
- **customer_email**: How to contact them
- **event_date**: When they want the rental
- **fulfillment_type**: "setup" or "pickup"
- **address**: Venue address (if setup)
- **status**: enquiry, confirmed, paid, completed, cancelled
- **message**: Custom requests from customer
- **total_amount**: Rental price + delivery fee if applicable

### Follow Up on Bookings

1. Booking starts as **"enquiry"** - this is a reservation request
2. Check the message and address
3. Confirm details and update status to **"confirmed"**
4. Collect payment (payment_method field)
5. Update status to **"paid"**
6. Deliver/setup the items
7. Update status to **"completed"**

## View Orders (Shop)

Go to **orders** table in Supabase:

Each row shows:
- **customer_name**: Buyer name
- **customer_email**: Contact email
- **items**: JSON array of what they ordered (product IDs, quantities, personalization)
- **total_amount**: Final cost
- **shipping_address**: Where to send it
- **status**: pending, paid, shipped, delivered, cancelled
- **payment_method**: stripe, bank_transfer, or afterpay

### Follow Up on Orders

1. Order starts as **"pending"** - waiting for payment
2. Receive payment confirmation
3. Update status to **"paid"**
4. Package and ship order
5. Update status to **"shipped"**
6. Once delivered, update to **"delivered"**

## Messages

Go to **messages** table to see inquiries:

- **related_to**: Product, booking, or order ID they're asking about
- **related_type**: "product", "booking", or "order"
- **content**: Their question or request
- **sender_email**: Reply to this address

## Payment Status

Go to **payments** table:

- **method**: stripe, bank_transfer, or afterpay
- **amount**: How much they need to pay
- **status**: pending, completed, failed, refunded
- **stripe_payment_id**: If using Stripe (for tracking/refunds)

### Processing Bank Transfers

For customers choosing bank transfer:
1. Send them your bank details
2. When they transfer, manually verify in your bank account
3. Update payment status to **"completed"**
4. Update related booking/order status to **"paid"**

## Analytics & Reports

### Track Popular Items

```sql
SELECT 
  p.name, 
  COUNT(o.id) as total_orders,
  SUM(o.total_amount) as revenue
FROM products p
LEFT JOIN orders o ON p.id = ANY(o.items)
WHERE p.type = 'sale'
GROUP BY p.id, p.name
ORDER BY revenue DESC;
```

Run in Supabase **SQL Editor**.

### Track Bookings by Date

```sql
SELECT 
  event_date,
  COUNT(*) as bookings,
  SUM(total_amount) as revenue
FROM bookings
WHERE status IN ('confirmed', 'paid', 'completed')
GROUP BY event_date
ORDER BY event_date DESC;
```

### Track Revenue by Month

```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_orders,
  SUM(total_amount) as total_revenue
FROM orders
WHERE status IN ('paid', 'shipped', 'delivered')
GROUP BY month
ORDER BY month DESC;
```

## Image Management

### Upload Product Images

1. **Option 1: Use Supabase Storage**
   - Go to **Storage** (left sidebar)
   - Create a bucket called `products`
   - Upload images
   - Get the public URL
   - Add URL to product images field

2. **Option 2: Use External CDN**
   - Upload images to Cloudinary, imgix, or similar
   - Get the public URL
   - Add to product images field

### Format Images

For best results:
- Square images (1:1 ratio) for product cards
- High quality (at least 800x800px)
- Optimized file size (compress before uploading)
- Consistent style/lighting for professional look

## Backup Your Data

Supabase automatically backs up daily, but you can:

1. Go to **Settings** (bottom left)
2. **Backups** - view automatic backups
3. Or run this to export data:

```bash
# Export via supabase-cli
supabase db dump --dry-run -f backup.sql
```

## Delete Products

Mark a product as inactive instead of deleting:

In Supabase, set **active** to false. This keeps historical data but hides it from the site.

To permanently delete:
```sql
DELETE FROM products WHERE id = 'product-uuid';
```

⚠️ This deletes all related bookings/orders too!

## Update Prices

1. Go to **products** table
2. Find the product
3. Update **base_price**
4. Changes take effect immediately on the website

## Pause Rentals

If you're booked out or need a break:

1. Update **rental_availability** - set `is_available` to false for dates you can't handle
2. Or delete the product temporarily by setting `active` to false

## Enable Maintenance Mode

Temporarily close the site by updating the **products** table:

```sql
UPDATE products SET active = false;
```

To reopen:

```sql
UPDATE products SET active = true;
```

## Team Access

To give someone else access:

1. Go to **Settings** > **Users & Permissions**
2. Invite team members by email
3. They'll get access to the Supabase dashboard

## Troubleshooting

**Bookings not showing up?**
- Check status filter - they might be "enquiry" status
- Verify customer_email isn't empty

**Orders not appearing?**
- Check created_at date range
- Verify status field isn't filtering them out

**Images showing blank?**
- Check image URL is public/accessible
- Verify JSON format in images field: `["url1", "url2"]`

**Can't find a product?**
- It might be set to `active = false`
- Use SQL query to find it:
  ```sql
  SELECT * FROM products WHERE name ILIKE '%search-term%';
  ```

## Next: Build Admin Dashboard

When ready, create a protected admin panel to:
- View/edit products
- Manage bookings and orders
- Process payments
- View analytics
- Send notifications

This site is built to make that easy - just add authentication and protected routes!
