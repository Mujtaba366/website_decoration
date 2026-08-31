# Admin Panel Setup Guide

## Overview
This admin panel provides a completely separate interface from the main website. Access is via `/admin` URL only - there are no navigation links from the main site.

## Key Features
- ✅ Username/password authentication (not email-based)
- ✅ Separate admin interface with custom top navigation
- ✅ Session management with 24-hour timeout
- ✅ Protected routes - only accessible when logged in
- ✅ No signup capability - only direct database credentials

## Database Setup

You need to create an `admin_users` table in your Supabase database.

### SQL Setup (Run this in Supabase SQL Editor)

```sql
-- Create admin_users table
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  email text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create index on username for faster lookups
CREATE INDEX idx_admin_users_username ON admin_users(username);

-- Insert a test admin user (CHANGE THESE CREDENTIALS!)
INSERT INTO admin_users (username, password, email) VALUES
  ('admin', 'your_secure_password_here', 'admin@example.com');
```

⚠️ **IMPORTANT SECURITY NOTES:**
1. Replace `'your_secure_password_here'` with a strong password
2. For production, consider hashing passwords using bcrypt or similar
3. Never commit actual credentials to version control
4. Store credentials in environment variables or secure vaults

## Environment Variables

Make sure your `.env.local` file has:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How to Access

1. **Login**: Visit `http://localhost:3000/admin` (or your production URL)
2. **Dashboard**: After login, you'll be redirected to `/admin/dashboard`
3. **Navigation**: Use the top nav to access Orders, Products, and Settings
4. **Logout**: Click the "Logout" button in the top nav

## Admin Features

The admin panel includes:

### Dashboard
- Overview stats (orders, pending, products, revenue)
- Recent orders summary

### Orders
- View and manage all customer orders
- Export functionality

### Products
- Manage product inventory
- Add new products
- Update product listings

### Settings
- General site configuration
- Security settings (change password)

## Authentication Flow

1. User enters username/password on `/admin` page
2. System queries `admin_users` table in Supabase
3. On successful match, creates session in localStorage
4. Session persists for 24 hours
5. Protected pages check session before rendering
6. Session automatically expires after 24 hours

## Protected Layout

All admin pages (except login) use `AdminProtectedLayout` component which:
- Checks if user is logged in
- Redirects to login if not authenticated
- Shows loading state while checking auth
- Displays top navigation and main content when authenticated

## Customization

### Adding New Admin Pages

1. Create a new file in `/app/admin/yourpage/page.tsx`
2. Wrap with `<AdminProtectedLayout>`
3. Add navigation link in `components/admin-topnav.tsx`

Example:
```tsx
'use client';

import { AdminProtectedLayout } from '@/components/admin-protected-layout';

export default function AdminYourPage() {
  return (
    <AdminProtectedLayout>
      <div>Your content here</div>
    </AdminProtectedLayout>
  );
}
```

### Modifying Styling

- Admin top nav: `components/admin-topnav.tsx`
- Protected layout: `components/admin-protected-layout.tsx`
- Global admin styles: `app/admin/admin.css`

## Security Considerations

1. **No User Signup**: Only predefined admin users from database can login
2. **No Public Discovery**: No links from main site - only direct URL access
3. **Session Storage**: Uses localStorage with 24-hour timeout
4. **HTTPS Required**: Always use HTTPS in production
5. **Environment Variables**: Never commit credentials
6. **Password Security**: Consider implementing password hashing for production

## Troubleshooting

**Login not working?**
- Verify `admin_users` table exists in Supabase
- Check environment variables are set correctly
- Ensure credentials match exactly (case-sensitive)

**Redirecting to login infinitely?**
- Check browser localStorage is enabled
- Verify session hasn't expired (24-hour timeout)
- Clear localStorage and try again

**Can't access admin pages after login?**
- Session may have expired - logout and login again
- Check browser console for errors
- Verify Supabase connection is working

## Production Checklist

- [ ] Change default admin credentials
- [ ] Implement password hashing (bcrypt)
- [ ] Enable HTTPS only
- [ ] Set up regular backups of admin_users table
- [ ] Implement audit logging for admin actions
- [ ] Consider two-factor authentication
- [ ] Review and update security settings regularly
