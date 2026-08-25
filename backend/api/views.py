from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from functools import wraps
from api.supabase_client import get_supabase_client
import json
from datetime import datetime, timedelta

TABLE_PRODUCTS = 'products'
TABLE_BOOKINGS = 'bookings'
TABLE_ORDERS = 'orders'
TABLE_MESSAGES = 'messages'
TABLE_PAYMENTS = 'payments'
TABLE_RENTAL_AVAILABILITY = 'rental_availability'

AUCKLAND_SUBURBS = ['Auckland', 'North Shore', 'Waitakere', 'Manukau', 'Papakura', 'Kumeu']

def _response(data=None, error=None, status=200):
    """Standard API response format"""
    if error:
        return JsonResponse({'error': error}, status=status)
    return JsonResponse({'data': data} if data is not None else {}, status=status)

def is_within_auckland(address):
    """Check if address is within Auckland"""
    if not address:
        return False
    address_lower = address.lower()
    return any(suburb.lower() in address_lower for suburb in AUCKLAND_SUBURBS)

def calculate_delivery_fee(address):
    """Calculate delivery fee based on distance from Auckland"""
    if is_within_auckland(address):
        return 0
    return 50

# Product Endpoints

@csrf_exempt
@require_http_methods(['GET'])
def list_products(request):
    """List all products with optional filtering"""
    try:
        product_type = request.GET.get('type')
        category = request.GET.get('category')

        query = get_supabase_client().table(TABLE_PRODUCTS).select('*').eq('active', True)

        if product_type:
            query = query.eq('type', product_type)
        if category:
            query = query.eq('category', category)

        response = query.execute()
        return _response(data=response.data)
    except Exception as e:
        return _response(error=str(e), status=500)

@csrf_exempt
@require_http_methods(['GET'])
def product_detail(request, product_id):
    """Get product details"""
    try:
        response = get_supabase_client().table(TABLE_PRODUCTS).select('*').eq('id', product_id).execute()
        if response.data:
            return _response(data=response.data[0])
        return _response(error='Product not found', status=404)
    except Exception as e:
        return _response(error=str(e), status=500)

# Rental Availability Endpoints

@csrf_exempt
@require_http_methods(['GET'])
def get_availability(request, product_id):
    """Get availability for a rental product"""
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if not start_date:
            start_date = datetime.now().date().isoformat()
        if not end_date:
            end_date = (datetime.now().date() + timedelta(days=90)).isoformat()

        query = get_supabase_client().table(TABLE_RENTAL_AVAILABILITY).select('*').eq('product_id', product_id)
        query = query.gte('date', start_date).lte('date', end_date)

        response = query.execute()
        return _response(data=response.data)
    except Exception as e:
        return _response(error=str(e), status=500)

# Booking Endpoints

@csrf_exempt
@require_http_methods(['POST'])
def create_booking(request):
    """Create rental booking"""
    try:
        data = json.loads(request.body)

        booking_data = {
            'product_id': data.get('product_id'),
            'customer_name': data.get('customer_name'),
            'customer_email': data.get('customer_email'),
            'customer_phone': data.get('customer_phone'),
            'event_date': data.get('event_date'),
            'fulfillment_type': data.get('fulfillment_type'),
            'address': data.get('address'),
            'message': data.get('message'),
            'status': 'enquiry',
        }

        if data.get('fulfillment_type') == 'setup' and data.get('address'):
            is_within = is_within_auckland(data.get('address'))
            booking_data['is_within_auckland'] = is_within
            booking_data['extra_fee'] = calculate_delivery_fee(data.get('address'))

        response = get_supabase_client().table(TABLE_BOOKINGS).insert(booking_data).execute()
        return _response(data=response.data[0] if response.data else None, status=201)
    except Exception as e:
        return _response(error=str(e), status=500)

@csrf_exempt
@require_http_methods(['GET'])
def booking_detail(request, booking_id):
    """Get booking details"""
    try:
        response = get_supabase_client().table(TABLE_BOOKINGS).select('*').eq('id', booking_id).execute()
        if response.data:
            return _response(data=response.data[0])
        return _response(error='Booking not found', status=404)
    except Exception as e:
        return _response(error=str(e), status=500)

# Order Endpoints

@csrf_exempt
@require_http_methods(['POST'])
def create_order(request):
    """Create shop order"""
    try:
        data = json.loads(request.body)

        order_data = {
            'customer_name': data.get('customer_name'),
            'customer_email': data.get('customer_email'),
            'customer_phone': data.get('customer_phone'),
            'items': data.get('items'),
            'total_amount': data.get('total_amount'),
            'payment_method': data.get('payment_method'),
            'status': 'pending',
            'shipping_address': data.get('shipping_address'),
        }

        response = get_supabase_client().table(TABLE_ORDERS).insert(order_data).execute()
        return _response(data=response.data[0] if response.data else None, status=201)
    except Exception as e:
        return _response(error=str(e), status=500)

@csrf_exempt
@require_http_methods(['GET'])
def order_detail(request, order_id):
    """Get order details"""
    try:
        response = get_supabase_client().table(TABLE_ORDERS).select('*').eq('id', order_id).execute()
        if response.data:
            return _response(data=response.data[0])
        return _response(error='Order not found', status=404)
    except Exception as e:
        return _response(error=str(e), status=500)

# Message Endpoints

@csrf_exempt
@require_http_methods(['POST'])
def create_message(request):
    """Send a message related to a product/booking/order"""
    try:
        data = json.loads(request.body)

        message_data = {
            'related_to': data.get('related_to'),
            'related_type': data.get('related_type'),
            'sender_name': data.get('sender_name'),
            'sender_email': data.get('sender_email'),
            'content': data.get('content'),
        }

        response = get_supabase_client().table(TABLE_MESSAGES).insert(message_data).execute()
        return _response(data=response.data[0] if response.data else None, status=201)
    except Exception as e:
        return _response(error=str(e), status=500)

@csrf_exempt
@require_http_methods(['GET'])
def list_messages(request, related_id):
    """List messages for a product/booking/order"""
    try:
        response = get_supabase_client().table(TABLE_MESSAGES).select('*').eq('related_to', related_id).execute()
        return _response(data=response.data)
    except Exception as e:
        return _response(error=str(e), status=500)

# Payment Endpoints

@csrf_exempt
@require_http_methods(['POST'])
def create_payment(request):
    """Create a payment"""
    try:
        data = json.loads(request.body)

        payment_data = {
            'order_id': data.get('order_id'),
            'booking_id': data.get('booking_id'),
            'method': data.get('method'),
            'amount': data.get('amount'),
            'status': 'pending',
        }

        response = get_supabase_client().table(TABLE_PAYMENTS).insert(payment_data).execute()
        return _response(data=response.data[0] if response.data else None, status=201)
    except Exception as e:
        return _response(error=str(e), status=500)

@csrf_exempt
@require_http_methods(['GET'])
def payment_detail(request, payment_id):
    """Get payment details"""
    try:
        response = get_supabase_client().table(TABLE_PAYMENTS).select('*').eq('id', payment_id).execute()
        if response.data:
            return _response(data=response.data[0])
        return _response(error='Payment not found', status=404)
    except Exception as e:
        return _response(error=str(e), status=500)
