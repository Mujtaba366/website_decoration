# Backend Test Instructions

## Start the Backend Server

```bash
cd backend
.\venv\Scripts\Activate.ps1  # On Windows PowerShell

# Then run:
python manage.py runserver
```

The server will start at `http://localhost:8000/api`

## Test API Endpoints

Once the server is running, you can test the endpoints. However, they require Supabase to be configured.

### 1. Set up .env file

Create `backend/.env`:
```
DEBUG=True
DJANGO_SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENVIRONMENT=development
```

### 2. Get Supabase Credentials

1. Go to https://supabase.com
2. Create a new project (free tier)
3. Go to **Settings > API**
4. Copy:
   - Project URL → `SUPABASE_URL`
   - Anon Key (public) → `SUPABASE_KEY`
   - Service Role Key (secret) → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Create Database Tables

In Supabase **SQL Editor**, run all statements from `SUPABASE_SCHEMA.md`

### 4. Test API

Now with server running, test endpoints:

**List Products:**
```bash
curl http://localhost:8000/api/products/
```

**Get Product:**
```bash
curl http://localhost:8000/api/products/{product-id}/
```

**Create Rental Booking:**
```bash
curl -X POST http://localhost:8000/api/bookings/ \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "product-uuid",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "event_date": "2025-09-15",
    "fulfillment_type": "setup",
    "address": "123 Main St, Auckland"
  }'
```

**Create Shop Order:**
```bash
curl -X POST http://localhost:8000/api/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Jane Doe",
    "customer_email": "jane@example.com",
    "items": [
      {
        "product_id": "product-uuid",
        "quantity": 2,
        "personalization": "John & Jane",
        "price": 45.00
      }
    ],
    "total_amount": 90.00,
    "payment_method": "stripe",
    "shipping_address": {
      "street": "456 Oak Ave",
      "city": "Auckland",
      "postcode": "1010",
      "country": "New Zealand"
    }
  }'
```

### 5. Frontend

In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

## Troubleshooting

**"ImportError: cannot import name 'config' from 'decouple'"**
- Fixed! We now use `python-dotenv` instead

**"SUPABASE_URL not set"**
- Create `.env` file in backend folder
- Add Supabase credentials

**"No products showing"**
- Ensure database tables are created
- Check Supabase is connected (look at response errors)
- Insert sample data using SQL from `SUPABASE_SCHEMA.md`

**"CORS errors from frontend"**
- Update `CORS_ALLOWED_ORIGINS` in `.env`
- Make sure frontend URL matches exactly

## Next Steps

1. ✅ Start backend: `python manage.py runserver`
2. ✅ Start frontend: `npm run dev`
3. 📋 Add sample products via Supabase SQL
4. 🧪 Test flows in browser
5. 🚀 Deploy to production when ready

See `DEPLOYMENT.md` for production setup!
