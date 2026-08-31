# Admin Panel - Quick Start (5 minutes)

## Step 1: Setup Database (2 minutes)

Go to your **Supabase SQL Editor** and run:

```sql
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  email text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX idx_admin_users_username ON admin_users(username);

INSERT INTO admin_users (username, password, email)
VALUES ('admin', 'changeme123', 'admin@example.com');
```

✅ Done! You now have an admin user with:
- **Username**: `admin`
- **Password**: `changeme123`

## Step 2: Configure Environment (1 minute)

Copy `.env.admin.example` to `.env.local`:

```bash
cp frontend/.env.admin.example frontend/.env.local
```

Fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_actual_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_key
```

Find these in Supabase → Project Settings → API

## Step 3: Start Development Server (1 minute)

```bash
cd frontend
npm run dev
```

## Step 4: Login (1 minute)

1. Open: **`http://localhost:3000/admin`**
2. Username: **`admin`**
3. Password: **`changeme123`**
4. Click **Sign in**

✅ You should see the admin dashboard!

## What You Get

After login, you have:

- **Dashboard** - Overview and stats
- **Orders** - Manage customer orders
- **Products** - Manage inventory
- **Settings** - Configuration & security
- **Logout** button in top nav

## Key Points

✅ **Only Accessible by URL** - No navigation links from main site
✅ **Username/Password Only** - No email signup
✅ **Separate Interface** - Completely different from main site
✅ **24-Hour Sessions** - Auto logout after 24 hours
✅ **Protected Routes** - Can't access pages without login

## Change Default Password

In Supabase SQL Editor:

```sql
UPDATE admin_users 
SET password = 'your_new_password' 
WHERE username = 'admin';
```

## Add More Admins

```sql
INSERT INTO admin_users (username, password, email)
VALUES ('newadmin', 'secure_password', 'newadmin@example.com');
```

## Production Checklist

- [ ] Change default password
- [ ] Use strong passwords
- [ ] Set environment variables on server
- [ ] Enable HTTPS only
- [ ] Consider password hashing
- [ ] Set up monitoring/logging

## Common Issues

**"Can't login"**
- Check Supabase URL and key are correct
- Verify admin_users table exists
- Check username/password match exactly

**"Redirected to login constantly"**
- Session expired - log in again
- Check browser allows localStorage

**"Can't access admin from main site"**
- ✅ This is by design! Only `/admin` URL works
- No navigation links on purpose

## Files Created

```
frontend/
├── lib/admin-auth.ts                 (Auth logic)
├── components/admin-topnav.tsx       (Top navigation)
├── components/admin-protected-layout.tsx (Protection)
└── app/admin/
    ├── page.tsx                      (Login page)
    ├── layout.tsx                    (Admin layout)
    ├── admin.css                     (Admin styles)
    ├── dashboard/page.tsx            (Dashboard)
    ├── orders/page.tsx               (Orders)
    ├── products/page.tsx             (Products)
    └── settings/page.tsx             (Settings)

supabase/migrations/
└── 001_create_admin_users.sql        (DB setup)
```

## Next Steps

1. ✅ Run database setup (Step 1)
2. ✅ Configure environment (Step 2)
3. ✅ Test login (Step 4)
4. ✅ Change default password
5. ✅ Build out admin features as needed

For more details, see:
- `ADMIN_IMPLEMENTATION_SUMMARY.md` - Complete overview
- `frontend/ADMIN_SETUP.md` - Detailed setup guide
- `frontend/lib/admin-auth.ts` - Auth implementation

## Need Help?

Check:
1. Supabase URL and key are correct
2. admin_users table exists
3. .env.local has credentials
4. Browser allows localStorage
5. No TypeScript errors: `npm run typecheck`
