from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from functools import wraps
from api.supabase_client import (
    supabase,
    user_is_member_of_company,
    get_user_companies,
)
import json

TABLE_USERS = 'users'
TABLE_COMPANIES = 'companies'
TABLE_COMPANY_MEMBERS = 'company_members'
TABLE_BILLS = 'bills'
TABLE_PURCHASE_ORDERS = 'purchase_orders'
TABLE_CHART_OF_ACCOUNTS = 'chart_of_accounts'
TABLE_JOURNAL_ENTRIES = 'journal_entries'
TABLE_TAX_RATES = 'tax_rates'
TABLE_ITEMS = 'items'

def _response(data=None, error=None, status=200):
    """Standard API response format"""
    if error:
        return JsonResponse({'error': error}, status=status)
    return JsonResponse({'data': data} if data is not None else {}, status=status)

def _require_user(view_func):
    """Decorator to require authentication"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return _response(error='Unauthorized', status=401)

        token = auth_header[7:]
        try:
            user = supabase.auth.get_user(token)
            request.user_id = user.user.id if user and user.user else None
            if not request.user_id:
                return _response(error='Invalid token', status=401)
        except Exception:
            return _response(error='Invalid token', status=401)

        return view_func(request, *args, **kwargs)
    return wrapper

def _user_is_member_of_company(request, company_id):
    """Check if user has access to company"""
    if not hasattr(request, 'user_id'):
        return False
    return user_is_member_of_company(request.user_id, company_id)

# Auth Endpoints

@csrf_exempt
@require_http_methods(['GET'])
@_require_user
def auth_session(request):
    """Get current user session"""
    try:
        user_data = supabase.table(TABLE_USERS).select('*').eq('id', request.user_id).execute()
        if user_data.data:
            return _response(data=user_data.data[0])
        return _response(error='User not found', status=404)
    except Exception as e:
        return _response(error=str(e), status=500)

@csrf_exempt
@require_http_methods(['POST'])
def auth_logout(request):
    """Logout (client-side session cleanup)"""
    return _response(data={'message': 'Logged out'})

# Company Endpoints

@csrf_exempt
@require_http_methods(['GET'])
@_require_user
def list_companies(request):
    """List all companies for user"""
    try:
        companies = get_user_companies(request.user_id)
        return _response(data=companies)
    except Exception as e:
        return _response(error=str(e), status=500)

@csrf_exempt
@require_http_methods(['POST'])
@_require_user
def create_company(request):
    """Create a new company"""
    try:
        data = json.loads(request.body)
        company_data = {
            'owner_id': request.user_id,
            'display_name': data.get('display_name'),
            'legal_name': data.get('legal_name'),
            'currency': data.get('currency', 'USD'),
            'country': data.get('country'),
            'industry': data.get('industry'),
        }

        response = supabase.table(TABLE_COMPANIES).insert(company_data).execute()

        # Add owner as company member
        if response.data:
            company_id = response.data[0]['id']
            member_data = {
                'company_id': company_id,
                'user_id': request.user_id,
                'role': 'owner',
                'status': 'active',
            }
            supabase.table(TABLE_COMPANY_MEMBERS).insert(member_data).execute()

        return _response(data=response.data[0] if response.data else None)
    except Exception as e:
        return _response(error=str(e), status=500)

@csrf_exempt
@require_http_methods(['GET', 'PUT'])
@_require_user
def company_detail(request, company_id):
    """Get or update company"""
    if not _user_is_member_of_company(request, company_id):
        return _response(error='Access denied', status=403)

    try:
        if request.method == 'GET':
            response = supabase.table(TABLE_COMPANIES).select('*').eq('id', company_id).execute()
            if response.data:
                return _response(data=response.data[0])
            return _response(error='Company not found', status=404)

        elif request.method == 'PUT':
            data = json.loads(request.body)
            response = supabase.table(TABLE_COMPANIES).update(data).eq('id', company_id).execute()
            return _response(data=response.data[0] if response.data else None)
    except Exception as e:
        return _response(error=str(e), status=500)

@csrf_exempt
@require_http_methods(['GET', 'POST'])
@_require_user
def company_members(request, company_id):
    """List or add company members"""
    if not _user_is_member_of_company(request, company_id):
        return _response(error='Access denied', status=403)

    try:
        if request.method == 'GET':
            response = supabase.table(TABLE_COMPANY_MEMBERS).select(
                '*, users(*)'
            ).eq('company_id', company_id).execute()
            return _response(data=response.data)

        elif request.method == 'POST':
            data = json.loads(request.body)
            member_data = {
                'company_id': company_id,
                'user_id': data.get('user_id'),
                'role': data.get('role', 'user'),
                'status': 'invited',
            }
            response = supabase.table(TABLE_COMPANY_MEMBERS).insert(member_data).execute()
            return _response(data=response.data[0] if response.data else None)
    except Exception as e:
        return _response(error=str(e), status=500)

# Bill Endpoints

@csrf_exempt
@require_http_methods(['GET', 'POST'])
@_require_user
def list_create_bills(request, company_id):
    """List or create bills"""
    if not _user_is_member_of_company(request, company_id):
        return _response(error='Access denied', status=403)

    try:
        if request.method == 'GET':
            response = supabase.table(TABLE_BILLS).select('*').eq('company_id', company_id).execute()
            return _response(data=response.data)

        elif request.method == 'POST':
            data = json.loads(request.body)
            bill_data = {**data, 'company_id': company_id}
            response = supabase.table(TABLE_BILLS).insert(bill_data).execute()
            return _response(data=response.data[0] if response.data else None, status=201)
    except Exception as e:
        return _response(error=str(e), status=500)

@csrf_exempt
@require_http_methods(['GET', 'PUT', 'DELETE'])
@_require_user
def bill_detail(request, company_id, bill_id):
    """Get, update, or delete bill"""
    if not _user_is_member_of_company(request, company_id):
        return _response(error='Access denied', status=403)

    try:
        if request.method == 'GET':
            response = supabase.table(TABLE_BILLS).select('*').eq('id', bill_id).eq('company_id', company_id).execute()
            if response.data:
                return _response(data=response.data[0])
            return _response(error='Bill not found', status=404)

        elif request.method == 'PUT':
            data = json.loads(request.body)
            response = supabase.table(TABLE_BILLS).update(data).eq('id', bill_id).execute()
            return _response(data=response.data[0] if response.data else None)

        elif request.method == 'DELETE':
            supabase.table(TABLE_BILLS).delete().eq('id', bill_id).execute()
            return _response(data={'message': 'Bill deleted'})
    except Exception as e:
        return _response(error=str(e), status=500)

# Chart of Accounts Endpoints

@csrf_exempt
@require_http_methods(['GET', 'POST'])
@_require_user
def list_create_chart_of_accounts(request, company_id):
    """List or create chart of accounts"""
    if not _user_is_member_of_company(request, company_id):
        return _response(error='Access denied', status=403)

    try:
        if request.method == 'GET':
            response = supabase.table(TABLE_CHART_OF_ACCOUNTS).select('*').eq('company_id', company_id).execute()
            return _response(data=response.data)

        elif request.method == 'POST':
            data = json.loads(request.body)
            account_data = {**data, 'company_id': company_id}
            response = supabase.table(TABLE_CHART_OF_ACCOUNTS).insert(account_data).execute()
            return _response(data=response.data[0] if response.data else None, status=201)
    except Exception as e:
        return _response(error=str(e), status=500)

@csrf_exempt
@require_http_methods(['GET', 'PUT'])
@_require_user
def chart_of_account_detail(request, company_id, account_id):
    """Get or update chart of account"""
    if not _user_is_member_of_company(request, company_id):
        return _response(error='Access denied', status=403)

    try:
        if request.method == 'GET':
            response = supabase.table(TABLE_CHART_OF_ACCOUNTS).select('*').eq('id', account_id).eq('company_id', company_id).execute()
            if response.data:
                return _response(data=response.data[0])
            return _response(error='Account not found', status=404)

        elif request.method == 'PUT':
            data = json.loads(request.body)
            response = supabase.table(TABLE_CHART_OF_ACCOUNTS).update(data).eq('id', account_id).execute()
            return _response(data=response.data[0] if response.data else None)
    except Exception as e:
        return _response(error=str(e), status=500)

# Journal Entries Endpoints

@csrf_exempt
@require_http_methods(['GET', 'POST'])
@_require_user
def list_create_journal_entries(request, company_id):
    """List or create journal entries"""
    if not _user_is_member_of_company(request, company_id):
        return _response(error='Access denied', status=403)

    try:
        if request.method == 'GET':
            response = supabase.table(TABLE_JOURNAL_ENTRIES).select('*, journal_entry_lines(*)').eq('company_id', company_id).execute()
            return _response(data=response.data)

        elif request.method == 'POST':
            data = json.loads(request.body)
            lines = data.pop('lines', [])
            entry_data = {**data, 'company_id': company_id, 'status': 'draft'}
            response = supabase.table(TABLE_JOURNAL_ENTRIES).insert(entry_data).execute()

            if response.data and lines:
                entry_id = response.data[0]['id']
                for line in lines:
                    line['journal_entry_id'] = entry_id
                supabase.table('journal_entry_lines').insert(lines).execute()

            return _response(data=response.data[0] if response.data else None, status=201)
    except Exception as e:
        return _response(error=str(e), status=500)

@csrf_exempt
@require_http_methods(['GET'])
@_require_user
def journal_entry_detail(request, company_id, entry_id):
    """Get journal entry"""
    if not _user_is_member_of_company(request, company_id):
        return _response(error='Access denied', status=403)

    try:
        response = supabase.table(TABLE_JOURNAL_ENTRIES).select('*, journal_entry_lines(*)').eq('id', entry_id).eq('company_id', company_id).execute()
        if response.data:
            return _response(data=response.data[0])
        return _response(error='Journal entry not found', status=404)
    except Exception as e:
        return _response(error=str(e), status=500)

@csrf_exempt
@require_http_methods(['POST'])
@_require_user
def post_journal_entry(request, company_id, entry_id):
    """Post journal entry"""
    if not _user_is_member_of_company(request, company_id):
        return _response(error='Access denied', status=403)

    try:
        supabase.table(TABLE_JOURNAL_ENTRIES).update({'status': 'posted'}).eq('id', entry_id).execute()
        return _response(data={'message': 'Journal entry posted'})
    except Exception as e:
        return _response(error=str(e), status=500)

# Items Endpoints

@csrf_exempt
@require_http_methods(['GET', 'POST'])
@_require_user
def list_create_items(request, company_id):
    """List or create items"""
    if not _user_is_member_of_company(request, company_id):
        return _response(error='Access denied', status=403)

    try:
        if request.method == 'GET':
            response = supabase.table(TABLE_ITEMS).select('*').eq('company_id', company_id).execute()
            return _response(data=response.data)

        elif request.method == 'POST':
            data = json.loads(request.body)
            item_data = {**data, 'company_id': company_id}
            response = supabase.table(TABLE_ITEMS).insert(item_data).execute()
            return _response(data=response.data[0] if response.data else None, status=201)
    except Exception as e:
        return _response(error=str(e), status=500)

@csrf_exempt
@require_http_methods(['GET', 'PUT'])
@_require_user
def item_detail(request, company_id, item_id):
    """Get or update item"""
    if not _user_is_member_of_company(request, company_id):
        return _response(error='Access denied', status=403)

    try:
        if request.method == 'GET':
            response = supabase.table(TABLE_ITEMS).select('*').eq('id', item_id).eq('company_id', company_id).execute()
            if response.data:
                return _response(data=response.data[0])
            return _response(error='Item not found', status=404)

        elif request.method == 'PUT':
            data = json.loads(request.body)
            response = supabase.table(TABLE_ITEMS).update(data).eq('id', item_id).execute()
            return _response(data=response.data[0] if response.data else None)
    except Exception as e:
        return _response(error=str(e), status=500)

# Tax Rates Endpoints

@csrf_exempt
@require_http_methods(['GET', 'POST'])
@_require_user
def list_create_tax_rates(request, company_id):
    """List or create tax rates"""
    if not _user_is_member_of_company(request, company_id):
        return _response(error='Access denied', status=403)

    try:
        if request.method == 'GET':
            response = supabase.table(TABLE_TAX_RATES).select('*').eq('company_id', company_id).execute()
            return _response(data=response.data)

        elif request.method == 'POST':
            data = json.loads(request.body)
            rate_data = {**data, 'company_id': company_id}
            response = supabase.table(TABLE_TAX_RATES).insert(rate_data).execute()
            return _response(data=response.data[0] if response.data else None, status=201)
    except Exception as e:
        return _response(error=str(e), status=500)

@csrf_exempt
@require_http_methods(['GET', 'PUT'])
@_require_user
def tax_rate_detail(request, company_id, rate_id):
    """Get or update tax rate"""
    if not _user_is_member_of_company(request, company_id):
        return _response(error='Access denied', status=403)

    try:
        if request.method == 'GET':
            response = supabase.table(TABLE_TAX_RATES).select('*').eq('id', rate_id).eq('company_id', company_id).execute()
            if response.data:
                return _response(data=response.data[0])
            return _response(error='Tax rate not found', status=404)

        elif request.method == 'PUT':
            data = json.loads(request.body)
            response = supabase.table(TABLE_TAX_RATES).update(data).eq('id', rate_id).execute()
            return _response(data=response.data[0] if response.data else None)
    except Exception as e:
        return _response(error=str(e), status=500)
