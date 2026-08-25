# Business Management Platform

A full-stack web application for managing business operations including sales, purchases, accounting, and reporting.

## Project Structure

```
.
├── frontend/                 # React 19 + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Reusable UI components
│   │   │   └── layout/      # Layout components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context (CompanyContext)
│   │   ├── lib/             # API client, utilities
│   │   ├── data/            # Mock data for development
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx          # Main app component
│   │   └── index.css        # Tailwind imports
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── backend/                  # Django REST API
    ├── api/
    │   ├── views.py         # API endpoints
    │   ├── urls.py          # URL routing
    │   ├── apps.py          # App configuration
    │   └── supabase_client.py
    ├── core/
    │   ├── settings.py      # Django settings
    │   └── urls.py          # Project routing
    ├── manage.py
    └── requirements.txt
```

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite (build tool)
- Tailwind CSS 4
- React Router v7
- Lucide React (icons)
- Axios (HTTP client)

### Backend
- Django 4.2
- Django REST Framework
- Supabase (PostgreSQL + Auth)
- Python 3.9+

### Database
- PostgreSQL (via Supabase)
- Supabase Authentication

## Setup Instructions

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.9+ (for backend)
- PostgreSQL (or Supabase)
- Git

### Backend Setup

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup (with Supabase)**
   - Create a Supabase project at https://supabase.com
   - Note your Project URL and API keys
   - Run migrations through Supabase console

5. **Run the server**
   ```bash
   python manage.py runserver
   ```

   The API will be available at `http://localhost:8000/api`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DB_NAME=business_db
DB_USER=postgres
DB_PASSWORD=your_password
DEBUG=True
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database Schema

### Key Tables
- `users` - User profiles
- `companies` - Company information
- `company_members` - Company membership with roles
- `roles` - Role definitions
- `permissions` - Permission system
- `chart_of_accounts` - General ledger accounts
- `journal_entries` - Accounting entries
- `bills` - Vendor bills
- `purchase_orders` - Purchase orders
- `items` - Products/services
- `tax_rates` - Tax configurations

## API Endpoints

### Authentication
- `GET /api/auth/session/` - Get current user session
- `POST /api/auth/logout/` - Logout

### Companies
- `GET /api/companies/` - List companies
- `POST /api/companies/` - Create company
- `GET /api/companies/{id}/` - Get company details
- `PUT /api/companies/{id}/` - Update company
- `GET /api/companies/{id}/members/` - List members
- `POST /api/companies/{id}/members/` - Add member

### Bills
- `GET /api/companies/{id}/bills/` - List bills
- `POST /api/companies/{id}/bills/` - Create bill
- `GET /api/companies/{id}/bills/{bill_id}/` - Get bill
- `PUT /api/companies/{id}/bills/{bill_id}/` - Update bill
- `DELETE /api/companies/{id}/bills/{bill_id}/` - Delete bill

### Chart of Accounts
- `GET /api/companies/{id}/chart-of-accounts/` - List accounts
- `POST /api/companies/{id}/chart-of-accounts/` - Create account
- `GET /api/companies/{id}/chart-of-accounts/{account_id}/` - Get account
- `PUT /api/companies/{id}/chart-of-accounts/{account_id}/` - Update account

### Journal Entries
- `GET /api/companies/{id}/journal-entries/` - List entries
- `POST /api/companies/{id}/journal-entries/` - Create entry
- `GET /api/companies/{id}/journal-entries/{entry_id}/` - Get entry
- `POST /api/companies/{id}/journal-entries/{entry_id}/post/` - Post entry

### Items
- `GET /api/companies/{id}/items/` - List items
- `POST /api/companies/{id}/items/` - Create item
- `GET /api/companies/{id}/items/{item_id}/` - Get item
- `PUT /api/companies/{id}/items/{item_id}/` - Update item

### Tax Rates
- `GET /api/companies/{id}/tax-rates/` - List tax rates
- `POST /api/companies/{id}/tax-rates/` - Create tax rate
- `GET /api/companies/{id}/tax-rates/{rate_id}/` - Get tax rate
- `PUT /api/companies/{id}/tax-rates/{rate_id}/` - Update tax rate

## Key Features

### Frontend
- **Dashboard** - Overview of company financials and recent activity
- **Bills Management** - View and manage vendor bills
- **Purchase Orders** - Create and track purchase orders
- **Accounting** - Chart of accounts and journal entries
- **Reporting** - Financial reports (in progress)
- **Team Management** - User roles and permissions
- **Responsive Design** - Works on desktop, tablet, and mobile

### Backend
- **API-First Architecture** - RESTful API for all operations
- **Authentication** - Supabase session-based authentication
- **Authorization** - Role-based access control
- **Data Validation** - Input validation and error handling
- **Supabase Integration** - PostgreSQL database with built-in features

## Development

### Running Both Frontend and Backend

**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Access the application at `http://localhost:5173`

### Building for Production

**Frontend:**
```bash
npm run build
# Output in dist/ directory
```

**Backend:**
- Use Gunicorn or similar WSGI server
- Set DEBUG=False
- Configure proper database and secret key

## Testing

### Frontend
```bash
npm run test
```

### Backend
```bash
python manage.py test
```

## Code Organization

### Frontend Conventions
- Components in `src/components/` organized by type (ui/, layout/)
- Page components in `src/pages/`
- API calls through `lib/api.ts`
- Types in `src/types/index.ts`
- Mock data in `src/data/mockData.ts` for development

### Backend Conventions
- All endpoints in `api/views.py`
- URL routing in `api/urls.py`
- CSRF exempt on API endpoints
- Consistent JSON response format
- User authentication required for most endpoints

## Security

- CSRF protection on Django endpoints
- CORS enabled for frontend
- Supabase auth for user management
- Session-based authentication
- Role-based access control
- Environment variables for secrets

## Deployment

### Frontend (Vercel, Netlify, etc.)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Heroku, Railway, AWS, etc.)
- Use Gunicorn as WSGI server
- Configure environment variables
- Set up PostgreSQL database
- Enable HTTPS

## Troubleshooting

### CORS Issues
- Check CORS_ALLOWED_ORIGINS in backend settings
- Ensure frontend URL matches allowed origins

### Authentication Issues
- Verify Supabase credentials in .env
- Check session token validity
- Clear browser cookies/session storage

### Database Connection Issues
- Verify DATABASE_URL or DB_* environment variables
- Check Supabase project is active
- Ensure network connectivity

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Create a pull request

## License

MIT License
