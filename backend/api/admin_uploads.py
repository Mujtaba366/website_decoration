"""
Admin file uploads. Currently just product images, uploaded to the
'product-images' Supabase Storage bucket. Replaces the old admin product
form's "paste an image URL" text field with a real file upload.
"""

import uuid
from flask import jsonify, request
from api.admin_views import verify_admin_token
from app.supabase_client import get_supabase_client, SupabaseError

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # matches the bucket's own file_size_limit
ALLOWED_CONTENT_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
}


def _authorize():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header[7:]
    is_valid, session = verify_admin_token(token)
    return session if is_valid else None


def upload_product_image():
    """
    POST /api/admin/products/upload-image
    Header: Authorization: Bearer <token>
    Body: multipart/form-data, field name "image"

    Returns: { "url": "https://.../storage/v1/object/public/product-images/..." }
    """
    if not _authorize():
        return jsonify({'error': 'Unauthorized'}), 401

    file = request.files.get('image')
    if not file or not file.filename:
        return jsonify({'error': 'No image file provided'}), 400

    content_type = file.content_type or ''
    extension = ALLOWED_CONTENT_TYPES.get(content_type)
    if not extension:
        return jsonify({'error': 'Unsupported image type. Use JPEG, PNG, WebP, or GIF.'}), 400

    data = file.read()
    if len(data) == 0:
        return jsonify({'error': 'The uploaded file is empty'}), 400
    if len(data) > MAX_UPLOAD_BYTES:
        return jsonify({'error': 'Image is too large. Maximum size is 5MB.'}), 400

    path = f'{uuid.uuid4()}.{extension}'

    try:
        supabase = get_supabase_client()
        url = supabase.upload_file('product-images', path, data, content_type)
        return jsonify({'url': url}), 201
    except SupabaseError as e:
        print(f"Upload product image error: {e}")
        return jsonify({'error': 'Failed to upload image. Please try again.'}), 502
    except Exception as e:
        print(f"Upload product image error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
