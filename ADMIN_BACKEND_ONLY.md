# Admin Authentication - Backend Only (Flask)

## Overview

The admin authentication system is **backend-only**. The frontend has NO direct connection to Supabase. All admin operations go through Flask backend endpoints.

### Architecture

```
Frontend (Next.js)              Backend (Flask)              Database (Supabase)
    ↓                               ↓                              ↓
  /admin                    /api/admin/login/
  Login Form        →        Verify credentials      →      admin_users table
    ↓                               ↓
  Store token               Issue JWT/token
  in localStorage                  ↓
    ↓                         Return token
  Send token with        ←
  each request
```

---

## Backend Setup (Flask)

### Files Created

**`backend/api/admin_views.py`** - Admin authentication logic
- `admin_login()` - POST /api/admin/login/
- `admin_logout()` - POST /api/admin/logout/
- `admin_verify()` - GET /api/admin/verify/
- `verify_admin_token()` - Utility function

**`backend/app/route.py`** (Modified)
- Added imports for admin functions
- Registered admin routes

### Endpoints

#### 1. Login Endpoint

```http
POST /api/admin/login/
Content-Type: application/json

{
  "username": "admin",
  "password": "changeme123"
}
```

**Response (Success - 200):**
```json
{
  "id": "session-id-here",
  "username": "admin",
  "token": "secure-token-here"
}
```

**Response (Failure - 401):**
```json
{
  "error": "Invalid credentials"
}
```

#### 2. Logout Endpoint

```http
POST /api/admin/logout/
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "message": "Logged out successfully"
}
```

#### 3. Verify Token Endpoint

```http
GET /api/admin/verify/
Authorization: Bearer <token>
```

**Response (Valid - 200):**
```json
{
  "valid": true,
  "username": "admin",
  "id": "session-id-here"
}
```

**Response (Invalid - 401):**
```json
{
  "valid": false
}
```

---

## Frontend Setup (Next.js)

### Files Modified

**`frontend/lib/admin-auth.ts`**
- Now calls backend API instead of Supabase
- Stores token from backend response
- Handles session management

**`frontend/lib/supabase/client.ts`**
- Disabled (commented out)
- No frontend Supabase access

### Environment Variables

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

For production:
```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

### Frontend Auth Flow

```typescript
// Login
const session = await authenticateAdmin({ 
  username: 'admin', 
  password: 'changeme123' 
});
// Calls: POST /api/admin/login/

// Session is stored as:
{
  id: "...",
  username: "admin",
  token: "...",
  loggedInAt: timestamp
}

// Send token with requests:
const token = getAdminToken(); // Get token from session
// Use in Authorization header: "Bearer " + token
```

---

## Session Management

### Storage
- **Location**: Browser localStorage
- **Key**: `admin_session`
- **Format**: JSON string with id, username, token, loggedInAt

### Timeout
- **Duration**: 24 hours
- **Checked**: On every `getAdminSession()` call
- **Action**: Auto-delete if expired

### Cleanup
- **Logout**: `logoutAdmin()` removes from localStorage
- **Expired**: Automatically removed when accessed
- **Manual**: User can clear localStorage (dev tools)

---

## Default Credentials

```
Username: admin
Password: changeme123
```

### Change Password

In backend, update `ADMIN_USERS` dictionary in `backend/api/admin_views.py`:

```python
ADMIN_USERS = {
    'admin': {
        'password': 'your_new_password',  # Change this
        'id': str(uuid.uuid4()),
        'username': 'admin'
    }
}
```

⚠️ **For production**: Use Supabase and hash passwords with bcrypt!

---

## Backend Configuration

### Current Implementation

The backend stores sessions in memory (`ADMIN_SESSIONS` dict). This works for development but **resets on server restart**.

### For Production

Replace the in-memory session storage with Supabase:

1. **Query admin users from Supabase**:
   ```python
   # In admin_login()
   admin_user = supabase.table('admin_users').select('*').eq('username', username).single()
   ```

2. **Hash passwords**:
   ```python
   from bcrypt import hashpw, checkpw
   
   # Check password
   if checkpw(password.encode(), admin_user['password'].encode()):
       # Password is correct
   ```

3. **Store sessions in database**:
   ```python
   supabase.table('admin_sessions').insert({
       'token': token,
       'admin_id': admin_user['id'],
       'expires_at': expires_at
   })
   ```

4. **Add to requirements**:
   ```
   bcrypt==4.0.1
   ```

---

## Security Notes

### ✅ What's Protected

- Backend receives credentials, not stored on frontend
- Frontend only gets token, not passwords
- Token expires after 24 hours
- CORS restricted to frontend origin

### ⚠️ What Needs Improvement (Production)

1. **Hash Passwords**
   - Current: Plaintext (for development)
   - Production: Use bcrypt or similar
   - Update: `backend/api/admin_views.py`

2. **Database Storage**
   - Current: In-memory dictionary
   - Production: Use Supabase database
   - Sessions: admin_sessions table
   - Credentials: admin_users table

3. **HTTPS Only**
   - Current: HTTP ok for development
   - Production: HTTPS required for token security

4. **Rate Limiting**
   - Add login attempt limits to prevent brute force
   - Use Flask-Limiter

5. **Audit Logging**
   - Log all admin login/logout events
   - Log admin actions (when implemented)

---

## Running the System

### 1. Start Backend

```bash
cd backend
python web.py
# Runs on http://localhost:5000
```

### 2. Start Frontend

```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### 3. Test Login

Visit: `http://localhost:3000/admin`

- Username: `admin`
- Password: `changeme123`
- Click "Sign in"

Should redirect to dashboard.

---

## Adding More Admin Users

Currently, admin users are defined in `backend/api/admin_views.py`:

```python
ADMIN_USERS = {
    'admin': {
        'password': 'changeme123',
        'id': str(uuid.uuid4()),
        'username': 'admin'
    },
    'newadmin': {  # Add here
        'password': 'newpassword',
        'id': str(uuid.uuid4()),
        'username': 'newadmin'
    }
}
```

### For Production

Move to database instead:

```python
# Query from Supabase
admin_user = supabase.table('admin_users').select('*').eq('username', username).single()
```

---

## Troubleshooting

### Frontend says "Can't connect to API"

1. Check backend is running: `http://localhost:5000/api/health`
2. Check `NEXT_PUBLIC_API_URL` is correct in `.env.local`
3. Check CORS is configured in backend (already done in `web.py`)
4. Restart frontend dev server

### Login always fails

1. Check credentials are exact (case-sensitive)
2. Check `ADMIN_USERS` dict in backend
3. Restart backend
4. Check browser console for error messages

### Token expired errors

1. Sessions expire after 24 hours
2. Login again to get new token
3. Check system time is correct

### "Authorization header missing" errors

1. Token must be sent as: `Authorization: Bearer <token>`
2. Check `admin-auth.ts` is properly sending token
3. Check backend is checking header correctly

---

## API Integration Example

If you want to use admin authentication in other backend routes:

```python
from api.admin_views import verify_admin_token

@app.route('/api/admin/dashboard/data', methods=['GET'])
def admin_dashboard_data():
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.replace('Bearer ', '').strip()
    
    # Verify token
    is_valid, session = verify_admin_token(token)
    if not is_valid:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Admin is verified, return their data
    return jsonify({
        'username': session['username'],
        'data': {...}
    })
```

---

## Files Summary

### Backend Files
- `backend/api/admin_views.py` - Admin auth logic
- `backend/app/route.py` - Route registration (modified)
- `backend/web.py` - Flask app (unchanged, already configured)

### Frontend Files
- `frontend/lib/admin-auth.ts` - Auth utilities (calls backend)
- `frontend/lib/supabase/client.ts` - Disabled (no frontend Supabase)
- `frontend/.env.admin.example` - Environment template
- `frontend/app/admin/page.tsx` - Login page
- `frontend/components/admin-topnav.tsx` - Top nav
- `frontend/components/admin-protected-layout.tsx` - Protection wrapper
- `frontend/app/admin/dashboard/page.tsx` - Dashboard
- `frontend/app/admin/orders/page.tsx` - Orders
- `frontend/app/admin/products/page.tsx` - Products
- `frontend/app/admin/settings/page.tsx` - Settings

---

## Next Steps

1. ✅ Copy `.env.admin.example` to `.env.local` with backend URL
2. ✅ Start backend: `python backend/web.py`
3. ✅ Start frontend: `npm run dev`
4. ✅ Test login at `http://localhost:3000/admin`
5. ✅ Change default password
6. ✅ For production: Implement password hashing and database storage

---

## Questions?

Refer to:
- `ADMIN_QUICK_START.md` - Quick setup guide
- `ADMIN_IMPLEMENTATION_SUMMARY.md` - Architecture overview
- `ADMIN_FILES_REFERENCE.md` - File-by-file reference
- Backend code: `backend/api/admin_views.py`
- Frontend code: `frontend/lib/admin-auth.ts`
