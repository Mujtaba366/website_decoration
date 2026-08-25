from supabase import create_client
from django.conf import settings

supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY
)

def get_supabase_client():
    return supabase

def get_user_id_from_session(request):
    """Extract user ID from Supabase session in request"""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
        try:
            user = supabase.auth.get_user(token)
            return user.user.id if user and user.user else None
        except Exception:
            return None
    return None

def user_is_member_of_company(user_id, company_id):
    """Check if user is a member of the company"""
    try:
        response = supabase.table('company_members').select(
            '*'
        ).eq('user_id', user_id).eq('company_id', company_id).execute()
        return len(response.data) > 0
    except Exception:
        return False

def get_user_companies(user_id):
    """Get all companies for a user"""
    try:
        response = supabase.table('company_members').select(
            'companies(*)'
        ).eq('user_id', user_id).execute()
        return [member['companies'] for member in response.data]
    except Exception:
        return []
