from django.conf import settings

_supabase = None

def get_supabase_client():
    """Lazy-load Supabase client to avoid import issues"""
    global _supabase

    if _supabase is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise RuntimeError("Supabase credentials not configured in .env")

        try:
            from supabase import create_client
            _supabase = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY
            )
        except ImportError as e:
            raise RuntimeError(f"Supabase library not installed: {e}")

    return _supabase

# Convenience alias
supabase = property(lambda self: get_supabase_client())

def get_user_id_from_session(request):
    """Extract user ID from Supabase session in request"""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
        try:
            client = get_supabase_client()
            user = client.auth.get_user(token)
            return user.user.id if user and user.user else None
        except Exception:
            return None
    return None

def user_is_member_of_company(user_id, company_id):
    """Check if user is a member of the company"""
    try:
        client = get_supabase_client()
        response = client.table('company_members').select(
            '*'
        ).eq('user_id', user_id).eq('company_id', company_id).execute()
        return len(response.data) > 0
    except Exception:
        return False

def get_user_companies(user_id):
    """Get all companies for a user"""
    try:
        client = get_supabase_client()
        response = client.table('company_members').select(
            'companies(*)'
        ).eq('user_id', user_id).execute()
        return [member['companies'] for member in response.data]
    except Exception:
        return []
