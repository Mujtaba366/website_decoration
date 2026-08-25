# Deployment Guide - Aziza Decoration Rentals & Wedding Shop

## Quick Start

### Prerequisites
- Supabase account (free tier works great)
- Node.js 18+ and Python 3.9+
- Django knowledge (minimal)
- Git

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run all CREATE TABLE statements from `SUPABASE_SCHEMA.md`
3. Copy your project URL and anon key from Settings > API

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Update .env with your Supabase credentials:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# DJANGO_SECRET_KEY=your-secret-key (generate one)

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

Backend will run at `http://localhost:8000/api`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env:
# VITE_API_URL=http://localhost:8000

# Start dev server
npm run dev
```

Frontend will run at `http://localhost:5173`

## Production Deployment

### Backend (Django)

**Option 1: Railway (Recommended for beginners)**

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Connect your GitHub repo
4. Add Postgres and set environment variables
5. Deploy

**Option 2: Heroku**

```bash
heroku create aziza-decoration-api
git push heroku main
heroku config:set SUPABASE_URL=...
heroku config:set DEBUG=False
```

**Option 3: AWS/DigitalOcean**

Use Gunicorn:
```bash
gunicorn core.wsgi --bind 0.0.0.0:8000
```

### Frontend (React)

**Option 1: Vercel (Recommended)**

1. Push code to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Set `VITE_API_URL` to your production backend URL
4. Deploy

**Option 2: Netlify**

```bash
npm run build
# Upload dist/ folder to Netlify
```

**Option 3: Your own server**

```bash
npm run build
# Serve dist/ folder with nginx or Apache
```

## Database & Payment Stripe Setup

### Add Sample Data to Supabase

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Insert sample rental products
INSERT INTO products (name, slug, description, type, category, base_price, images) VALUES
('White Flower Arch', 'white-flower-arch', 'Beautiful white setup with fresh flowers', 'rental', 'Arches', 250, '["flower-arch.jpg"]'::jsonb),
('Round Gold Backdrop', 'round-gold-backdrop', 'Elegant 8ft gold round backdrop', 'rental', 'Backdrops', 350, '["gold-backdrop.jpg"]'::jsonb),
('Wooden Benches Set', 'wooden-benches', 'Set of 3 decorated wooden benches', 'rental', 'Benches', 150, '["benches.jpg"]'::jsonb);

-- Insert sample shop products
INSERT INTO products (name, slug, description, type, category, base_price, images) VALUES
('Personalized Champagne Flutes', 'personalized-flutes', 'Set of 2 engraved champagne glasses', 'sale', 'Glassware', 45, '["flutes.jpg"]'::jsonb),
('Monogrammed Napkins', 'monogrammed-napkins', 'Set of 50 personalized paper napkins', 'sale', 'Table Settings', 25, '["napkins.jpg"]'::jsonb),
('Wooden Welcome Sign', 'welcome-sign', 'Custom engraved wooden sign', 'sale', 'Signage', 65, '["sign.jpg"]'::jsonb);
```

### Setup Stripe (Optional but Recommended)

1. Create Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from Dashboard > Developers > API Keys
3. Install Stripe Python package:
   ```bash
   pip install stripe
   ```
4. Update backend to handle Stripe payments (see Stripe docs for integration)
5. Update frontend to use Stripe.js checkout

## Environment Variables Checklist

### Backend (.env)
```
DEBUG=True                              # Set to False in production
DJANGO_SECRET_KEY=your-random-key      # Generate with: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
ALLOWED_HOSTS=localhost,127.0.0.1      # Add your domain for production
SUPABASE_URL=https://...supabase.co    # From Supabase Settings
SUPABASE_KEY=eyJ...                     # Anon key from Supabase
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Service role key (keep secret)
CORS_ALLOWED_ORIGINS=http://localhost:5173  # Add frontend URL
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000     # Backend URL
VITE_SUPABASE_URL=https://...supabase.co  # For direct auth (if needed)
VITE_SUPABASE_ANON_KEY=eyJ...          # Anon key (if needed)
```

## Email Notifications (Optional)

To send booking/order confirmations:

1. Use Supabase built-in email or external service (SendGrid, Mailgun)
2. Create database function to send emails on new bookings
3. Or use backend to send emails via Django

Example Django setup:
```python
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'  # Use app password, not your Gmail password
```

## Monitoring & Maintenance

1. **Monitor API** - Use Sentry or built-in logging
2. **Database backups** - Supabase handles automatic daily backups
3. **Analytics** - Add Google Analytics or Mixpanel to frontend
4. **Form submissions** - Consider using Formspree or similar for contact forms

## Common Issues & Solutions

**CORS errors**
- Update `CORS_ALLOWED_ORIGINS` in backend .env
- Ensure frontend URL matches exactly

**Database connection errors**
- Check `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Verify Supabase project is active

**Stripe payments not working**
- Check API keys are correct
- Ensure Stripe is integrated in both backend and frontend
- Test with Stripe test mode first

**Images not loading**
- Store images in Supabase Storage
- Update product image URLs to point to Storage URLs
- Or use external CDN like Cloudinary

## Next Steps

1. **Add booking confirmations** - Send email when booking/order created
2. **Implement reviews** - Let customers leave feedback
3. **Admin dashboard** - Create protected admin panel for order management
4. **Analytics** - Track which products are popular
5. **Inventory system** - Limit available quantities for shop items
6. **SMS notifications** - Send updates via Twilio

## Support

For issues:
- Check Supabase documentation: https://supabase.com/docs
- Django docs: https://docs.djangoproject.com
- React docs: https://react.dev
- File issues on GitHub with detailed error messages
