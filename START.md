# Quick Start - Aziza Decoration Rental & Wedding Shop

## Prerequisites
✅ Python 3.9+ installed
✅ Node.js 18+ installed  
✅ Git installed

## One-Time Setup

### 1. Install Dependencies

Open PowerShell in project root and run:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

Then frontend:
```powershell
cd frontend
npm install
cd ..
```

### 2. Create `.env` File

In `backend/` folder, create `.env`:
```
DEBUG=True
DJANGO_SECRET_KEY=your-secret-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENVIRONMENT=development
```

**Don't have Supabase yet?** See "Get Supabase Credentials" below.

### 3. Create Database Tables

In Supabase Dashboard:
1. Go to **SQL Editor**
2. Copy all SQL from `SUPABASE_SCHEMA.md`
3. Paste and run

## Daily Startup (Two Terminal Windows)

### Terminal 1 - Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

Backend runs at: **http://localhost:8000/api**

### Terminal 2 - Frontend
```powershell
cd frontend
npm run dev
```

Frontend runs at: **http://localhost:5173**

## Get Supabase Credentials

1. Go to https://supabase.com and sign up (free tier)
2. Create new project
3. Go to **Settings** (bottom left) → **API**
4. Copy:
   - **Project URL** → paste into `.env` as `SUPABASE_URL`
   - **Anon public key** → paste as `SUPABASE_KEY`
   - **Service role secret key** → paste as `SUPABASE_SERVICE_ROLE_KEY`

⚠️ Keep service role key SECRET - never commit to git!

## First-Time Data

After setting up Supabase, add sample products via SQL Editor:

```sql
-- Rental products
INSERT INTO products (name, slug, description, type, category, base_price, images) VALUES
('White Flower Arch', 'white-flower-arch', 'Beautiful white flower arch for ceremonies', 'rental', 'Arches', 250, '["arch.jpg"]'::jsonb),
('Round Gold Backdrop', 'round-gold-backdrop', 'Elegant 8ft gold round backdrop', 'rental', 'Backdrops', 350, '["backdrop.jpg"]'::jsonb),
('Wooden Benches', 'wooden-benches', 'Set of 3 decorated wooden benches', 'rental', 'Benches', 150, '["benches.jpg"]'::jsonb);

-- Shop products
INSERT INTO products (name, slug, description, type, category, base_price, images) VALUES
('Personalized Champagne Flutes', 'personalized-flutes', 'Set of 2 engraved champagne glasses', 'sale', 'Glassware', 45, '["flutes.jpg"]'::jsonb),
('Monogrammed Napkins', 'monogrammed-napkins', 'Set of 50 personalized paper napkins', 'sale', 'Table Settings', 25, '["napkins.jpg"]'::jsonb);

-- Add 90 days availability for rental items
WITH dates AS (
  SELECT generate_series(current_date, current_date + interval '90 days', interval '1 day')::date as date
)
INSERT INTO rental_availability (product_id, date, is_available)
SELECT (SELECT id FROM products WHERE slug = 'white-flower-arch'), date, true
FROM dates;
```

## Test It

Once both servers are running:

1. Open **http://localhost:5173** in browser
2. Click **Rentals** - should see White Flower Arch, Round Gold Backdrop, etc.
3. Click **Shop** - should see Personalized Flutes, Napkins, etc.
4. Click any product to see details

## Next Steps

- ✅ Servers running locally
- 📝 Add more products via Supabase
- 📸 Add product images
- 🚀 Deploy to production (see `DEPLOYMENT.md`)
- 💳 Setup Stripe payments (see `DEPLOYMENT.md`)

## Troubleshooting

**"Module not found" error**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Frontend won't start**
```powershell
cd frontend
npm install
npm run dev
```

**"Cannot connect to Supabase"**
- Check `.env` file has correct credentials
- Verify Supabase project is active
- Check database tables exist

**Port already in use**
- Backend: Change `python manage.py runserver 8001`
- Frontend: Change `npm run dev -- --port 5174`

## Documentation

- **DEPLOYMENT.md** - Production deployment (Railway, Vercel, etc.)
- **ADMIN_GUIDE.md** - Managing products, bookings, orders
- **TEST_BACKEND.md** - API testing with curl
- **SUPABASE_SCHEMA.md** - Database schema & setup

## Quick Commands

```powershell
# Reset database (caution: deletes all data)
cd backend
.\venv\Scripts\Activate.ps1
python manage.py flush

# Create superuser (if using admin panel)
python manage.py createsuperuser

# Generate secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

**Ready to go!** Start both servers and visit http://localhost:5173 🎉
