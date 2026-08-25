# Business Management Platform - Development Guidelines

## Project Overview
Full-stack business management application with React 19 frontend and Django REST API backend using Supabase PostgreSQL.

## Technology Stack
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4 + React Router v7
- **Backend:** Django 4.2 + DRF + Supabase (PostgreSQL + Auth)
- **Database:** PostgreSQL (via Supabase)

## Directory Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Button, Card, Input, Modal, Dropdown, Form, Badge, DataTable
│   │   └── layout/          # Layout, Sidebar, TopNav, PageHeader
│   ├── pages/               # Home, Bills, Purchases, Accounting, Reporting, Team, Settings
│   ├── context/             # CompanyContext for shared state
│   ├── lib/                 # api.ts (API client), utils.ts (utilities)
│   ├── data/                # mockData.ts for development
│   ├── types/               # TypeScript interfaces
│   └── App.tsx              # Main app with routing

backend/
├── api/
│   ├── views.py             # All API endpoint handlers
│   ├── urls.py              # URL routing
│   ├── supabase_client.py    # Supabase client setup
│   └── apps.py
├── core/
│   ├── settings.py          # Django configuration
│   ├── urls.py              # Project routing
│   └── __init__.py
└── manage.py
```

## Key Conventions

### API Response Format
All endpoints return JSON with consistent format:
```json
{
  "data": {...},
  "error": "message"  // Only present on errors
}
```

### Authentication
- Supabase session-based auth (Bearer token)
- `@_require_user` decorator on protected endpoints
- Token validation via `supabase.auth.get_user(token)`

### Authorization
- All endpoints check `user_is_member_of_company(user_id, company_id)`
- Company-scoped API routes: `/api/companies/{company_id}/{resource}/`

### Component Structure
- UI components in `src/components/ui/` - single responsibility, fully reusable
- Layout components in `src/components/layout/` - page structure
- Page components in `src/pages/` - route handlers
- All components use TypeScript with strict typing

### Styling
- Tailwind CSS classes directly in JSX
- Custom theme colors in `tailwind.config.ts` (brand-*)
- Utility functions in `cn()` from `lib/utils.ts` for conditional classes

### State Management
- `CompanyContext` for selected company state
- Local state for form/UI state
- Mock data in development (mockData.ts)

### API Client
- `apiClient` - base axios instance with interceptors
- Organized API functions: `authApi`, `companyApi`, `billApi`, etc.
- All requests use `/api` prefix (proxied in Vite)

### Database Tables
Named in snake_case with company_id foreign key:
- users, companies, company_members
- bills, purchase_orders, journal_entries
- chart_of_accounts, items, tax_rates
- Double-entry bookkeeping via journal_entry_lines

## Development Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Update with Supabase credentials
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env  # Update VITE_API_URL
npm run dev
```

Access frontend at `http://localhost:5173`
Access API at `http://localhost:8000/api`

## Code Style

### TypeScript
- Strict mode enabled
- Use interfaces for types, not `any`
- Import types: `import type { Bill } from '@types'`

### Components
- Use `React.forwardRef` for components that need refs
- Props interface named `{ComponentName}Props`
- No default exports, use named exports

### Utilities
- Pure functions in `lib/utils.ts`
- Format functions: `formatCurrency()`, `formatDate()`
- String manipulation: `cn()`, `truncate()`, `slugify()`

### API
- All handlers use `@csrf_exempt` and `@require_http_methods`
- Parse JSON: `json.loads(request.body)`
- Return via `_response()` helper
- Consistent error handling with try/except

## Common Tasks

### Adding a New Page
1. Create component in `src/pages/PageName.tsx`
2. Add route in `App.tsx` Routes
3. Add sidebar nav item if needed
4. Use `PageHeader` component for title

### Adding a New API Endpoint
1. Create handler function in `api/views.py`
2. Add route in `api/urls.py`
3. Use `@_require_user` decorator
4. Check `_user_is_member_of_company(request, company_id)`
5. Return via `_response(data, error, status)`

### Adding UI Component
1. Create in `src/components/ui/ComponentName.tsx`
2. Use TypeScript interfaces for props
3. Use `React.forwardRef` if needed
4. Export in `src/components/ui/index.ts`

### Adding Mock Data
1. Add to `src/data/mockData.ts`
2. Import and use in components during development
3. Replace with real API calls for production

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=https://...supabase.co
SUPABASE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=...
DJANGO_SECRET_KEY=...
DEBUG=True
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Supabase Setup

### Tables Required
- users (id, email, first_name, last_name, avatar_url, created_at)
- companies (id, owner_id, display_name, legal_name, currency, country, industry, created_at, updated_at)
- company_members (id, company_id, user_id, role, status, joined_at)
- bills (id, company_id, bill_number, vendor_id, date, due_date, amount, status, notes, created_at, updated_at)
- purchase_orders (id, company_id, po_number, vendor_id, date, delivery_date, amount, status, created_at, updated_at)
- chart_of_accounts (id, company_id, account_number, name, type, subtype, balance, is_active, created_at)
- journal_entries (id, company_id, entry_number, date, description, reference_type, reference_id, status, created_at, updated_at)
- journal_entry_lines (id, journal_entry_id, account_id, debit, credit, description)
- items (id, company_id, name, description, sku, unit_price, tax_rate_id, is_active, created_at)
- tax_rates (id, company_id, name, rate, is_active, created_at)

## Testing

### Frontend Components
- Use React Testing Library
- Test user interactions, not implementation
- Mock API calls with axios mock

### Backend Endpoints
- Use Django test client
- Mock Supabase client
- Test authorization and validation

## Deployment

### Frontend (Vercel/Netlify)
- Run `npm run build`
- Deploy `dist/` folder
- Set environment variables in dashboard

### Backend (Railway/AWS/Heroku)
- Use Gunicorn: `gunicorn core.wsgi`
- Set DEBUG=False
- Configure PostgreSQL connection
- Enable HTTPS

## Performance Optimizations

### Frontend
- Lazy load pages with React.lazy()
- Code splitting via Vite
- Memoize expensive components with React.memo()
- Virtual scrolling for large lists

### Backend
- Pagination (50 items per page default)
- Database indexes on foreign keys
- Cache frequently accessed data
- N+1 query optimization

## Security Checklist

- [ ] CSRF tokens on form submissions
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (use ORM/parameterized queries)
- [ ] XSS prevention (sanitize user input)
- [ ] CORS properly configured
- [ ] Secret keys in environment variables
- [ ] HTTPS enforced in production
- [ ] Rate limiting on API endpoints
- [ ] Regular dependency updates
