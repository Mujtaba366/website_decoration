"""
Admin dashboard and data endpoints - ALL USE SUPABASE DATABASE
"""

from flask import jsonify, request
from api.admin_views import verify_admin_token
from api.session_store import get_all_sessions
from app.supabase_client import get_supabase_client
import re
import uuid


def slugify(text):
    slug = re.sub(r'[^a-z0-9]+', '-', (text or '').lower()).strip('-')
    return slug or 'product'


def unique_slug(supabase, base_slug, exclude_id=None):
    existing = supabase.table('products').select('id,slug').execute().data or []
    taken = {p['slug'] for p in existing if p.get('id') != exclude_id}
    if base_slug not in taken:
        return base_slug
    i = 2
    while f'{base_slug}-{i}' in taken:
        i += 1
    return f'{base_slug}-{i}'


def get_dashboard_stats():
    """
    GET /api/admin/dashboard/stats
    Header: Authorization: Bearer <token>

    Returns dashboard statistics from Supabase database
    """
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing authorization header'}), 401

        token = auth_header[7:]  # Remove "Bearer " prefix

        is_valid, session = verify_admin_token(token)
        if not is_valid:
            return jsonify({'error': 'Unauthorized'}), 401

        supabase = get_supabase_client()

        # Get total products count
        try:
            products = supabase.table('products').select('id').execute()
            total_products = len(products.data) if products.data else 0
        except Exception as e:
            print(f"DEBUG: Failed to get products count: {e}")
            total_products = 0

        # Get total orders count
        try:
            orders = supabase.table('orders').select('id').execute()
            total_orders = len(orders.data) if orders.data else 0
        except Exception as e:
            print(f"DEBUG: Failed to get orders count: {e}")
            total_orders = 0

        # Get pending orders count
        try:
            pending = supabase.table('orders').select('id').eq('status', 'pending').execute()
            pending_orders = len(pending.data) if pending.data else 0
        except Exception as e:
            print(f"DEBUG: Failed to get pending orders: {e}")
            pending_orders = 0

        # Get total revenue (sum of paid/fulfilled orders - 'completed' is not a
        # valid orders.status value, so that never matched anything)
        try:
            paid = supabase.table('orders').select('total').eq('status', 'paid').execute()
            fulfilled = supabase.table('orders').select('total').eq('status', 'fulfilled').execute()
            total_revenue = sum(float(o.get('total', 0)) for o in (paid.data or []) + (fulfilled.data or []))
        except Exception as e:
            print(f"DEBUG: Failed to get revenue: {e}")
            total_revenue = 0

        return jsonify({
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'total_products': total_products,
            'total_revenue': total_revenue
        }), 200

    except Exception as e:
        print(f"Dashboard stats error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


def get_products():
    """
    GET /api/admin/products
    Header: Authorization: Bearer <token>

    Returns list of all products from Supabase database
    """
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing authorization header'}), 401

        token = auth_header[7:]  # Remove "Bearer " prefix

        is_valid, session = verify_admin_token(token)
        if not is_valid:
            return jsonify({'error': 'Unauthorized'}), 401

        supabase = get_supabase_client()
        result = supabase.table('products').select('*').execute()
        products_list = result.data if result.data else []

        return jsonify({
            'products': products_list,
            'total': len(products_list)
        }), 200

    except Exception as e:
        print(f"Get products error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


def create_product():
    """
    POST /api/admin/products
    Header: Authorization: Bearer <token>
    Body: { "name": "...", "base_price": 100, "description": "...", "category": "...",
            "type": "rental" | "sale", "images": ["..."], "personalization_label": "...",
            "active": true }

    Creates a new product in Supabase database. Slug is auto-generated from the
    name (or an explicit "slug") and de-duplicated against existing products.
    """
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing authorization header'}), 401

        token = auth_header[7:]  # Remove "Bearer " prefix

        is_valid, session = verify_admin_token(token)
        if not is_valid:
            return jsonify({'error': 'Unauthorized'}), 401

        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON'}), 400

        name = (data.get('name') or '').strip()
        if not name:
            return jsonify({'error': 'Name is required'}), 400

        supabase = get_supabase_client()
        slug = unique_slug(supabase, slugify(data.get('slug') or name))

        product = {
            'name': name,
            'slug': slug,
            'description': data.get('description') or None,
            'type': data.get('type') if data.get('type') in ('rental', 'sale') else 'rental',
            'category': data.get('category') or None,
            'base_price': data.get('base_price', 0),
            'images': data.get('images') or [],
            'personalization_label': data.get('personalization_label') or None,
            'active': data.get('active', True),
        }

        result = supabase.table('products').insert(product).execute()

        if result.data and len(result.data) > 0:
            return jsonify(result.data[0]), 201
        else:
            return jsonify({'error': 'Failed to create product'}), 400

    except Exception as e:
        print(f"Create product error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


def update_product(product_id):
    """
    PUT /api/admin/products/<product_id>
    Header: Authorization: Bearer <token>
    Body: any subset of { "name", "description", "type", "category", "base_price",
            "images", "personalization_label", "active", "slug" }

    Updates a product in Supabase database. If the name changes and no explicit
    slug is given, the slug is regenerated (staying unique) to match.
    """
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing authorization header'}), 401

        token = auth_header[7:]  # Remove "Bearer " prefix

        is_valid, session = verify_admin_token(token)
        if not is_valid:
            return jsonify({'error': 'Unauthorized'}), 401

        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON'}), 400

        supabase = get_supabase_client()

        update_data = {}
        for field in ('name', 'description', 'type', 'category', 'base_price', 'images', 'personalization_label', 'active'):
            if field in data:
                update_data[field] = data[field]

        if data.get('slug'):
            update_data['slug'] = unique_slug(supabase, slugify(data['slug']), exclude_id=product_id)
        elif data.get('name'):
            update_data['slug'] = unique_slug(supabase, slugify(data['name']), exclude_id=product_id)

        result = supabase.table('products').update(update_data).eq('id', product_id).execute()

        if result.data and len(result.data) > 0:
            return jsonify(result.data[0]), 200
        else:
            return jsonify({'error': 'Product not found'}), 404

    except Exception as e:
        print(f"Update product error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


def delete_product(product_id):
    """
    DELETE /api/admin/products/<product_id>
    Header: Authorization: Bearer <token>

    Deletes a product from Supabase database
    """
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing authorization header'}), 401

        token = auth_header[7:]  # Remove "Bearer " prefix

        is_valid, session = verify_admin_token(token)
        if not is_valid:
            return jsonify({'error': 'Unauthorized'}), 401

        supabase = get_supabase_client()
        result = supabase.table('products').delete().eq('id', product_id).execute()

        return jsonify({'message': 'Product deleted successfully'}), 200

    except Exception as e:
        print(f"Delete product error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
