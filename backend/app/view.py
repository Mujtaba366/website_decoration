from flask import jsonify
from app.supabase_client import get_supabase_client
import traceback

def handle_error(error):
    error_msg = str(error)
    print(f"ERROR: {error_msg}")
    print(traceback.format_exc())
    if hasattr(error, 'message'):
        return jsonify({'error': error.message}), 400
    return jsonify({'error': error_msg}), 400

# Products
def get_products(product_id=None):
    try:
        supabase = get_supabase_client()
        if product_id:
            response = supabase.table('products').select('*').eq('id', product_id).execute()
            data = response.data
            return jsonify(data[0] if data else None), 200 if data else 404
        else:
            response = supabase.table('products').select('*').execute()
            return jsonify(response.data), 200
    except Exception as e:
        return handle_error(e)

def create_product(data):
    try:
        supabase = get_supabase_client()
        response = supabase.table('products').insert(data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return handle_error(e)

def update_product(product_id, data):
    try:
        supabase = get_supabase_client()
        response = supabase.table('products').update(data).eq('id', product_id).execute()
        return jsonify(response.data[0] if response.data else None), 200
    except Exception as e:
        return handle_error(e)

def delete_product(product_id):
    try:
        supabase = get_supabase_client()
        supabase.table('products').delete().eq('id', product_id).execute()
        return jsonify({'message': 'Product deleted'}), 200
    except Exception as e:
        return handle_error(e)

# Bookings
def get_bookings(booking_id=None):
    try:
        supabase = get_supabase_client()
        if booking_id:
            response = supabase.table('bookings').select('*').eq('id', booking_id).execute()
            data = response.data
            return jsonify(data[0] if data else None), 200 if data else 404
        else:
            response = supabase.table('bookings').select('*').execute()
            return jsonify(response.data), 200
    except Exception as e:
        return handle_error(e)

def create_booking(data):
    try:
        supabase = get_supabase_client()
        event_date = data.get('event_date')

        if event_date:
            existing = supabase.table('blocked_dates').select('id').eq('date', event_date).execute().data
            if existing:
                return jsonify({'error': 'That date is no longer available'}), 409

        response = supabase.table('bookings').insert(data).execute()
        booking = response.data[0]

        if event_date:
            supabase.table('blocked_dates').insert({
                'date': event_date,
                'reason': f"Booking - {data.get('customer_name', 'customer')}",
                'booking_id': booking['id'],
            }).execute()

        return jsonify(booking), 201
    except Exception as e:
        return handle_error(e)

def update_booking(booking_id, data):
    try:
        supabase = get_supabase_client()
        response = supabase.table('bookings').update(data).eq('id', booking_id).execute()
        return jsonify(response.data[0] if response.data else None), 200
    except Exception as e:
        return handle_error(e)

def delete_booking(booking_id):
    try:
        supabase = get_supabase_client()
        supabase.table('blocked_dates').delete().eq('booking_id', booking_id).execute()
        supabase.table('bookings').delete().eq('id', booking_id).execute()
        return jsonify({'message': 'Booking deleted'}), 200
    except Exception as e:
        return handle_error(e)

# Rental Availability
def get_availability(availability_id=None):
    try:
        supabase = get_supabase_client()
        if availability_id:
            response = supabase.table('rental_availability').select('*').eq('id', availability_id).execute()
            data = response.data
            return jsonify(data[0] if data else None), 200 if data else 404
        else:
            response = supabase.table('rental_availability').select('*').execute()
            return jsonify(response.data), 200
    except Exception as e:
        return handle_error(e)

def create_availability(data):
    try:
        supabase = get_supabase_client()
        response = supabase.table('rental_availability').insert(data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return handle_error(e)

def update_availability(availability_id, data):
    try:
        supabase = get_supabase_client()
        response = supabase.table('rental_availability').update(data).eq('id', availability_id).execute()
        return jsonify(response.data[0] if response.data else None), 200
    except Exception as e:
        return handle_error(e)

def delete_availability(availability_id):
    try:
        supabase = get_supabase_client()
        supabase.table('rental_availability').delete().eq('id', availability_id).execute()
        return jsonify({'message': 'Availability deleted'}), 200
    except Exception as e:
        return handle_error(e)

# Orders
def get_orders(order_id=None):
    try:
        supabase = get_supabase_client()
        if order_id:
            response = supabase.table('orders').select('*').eq('id', order_id).execute()
            data = response.data
            return jsonify(data[0] if data else None), 200 if data else 404
        else:
            response = supabase.table('orders').select('*').execute()
            return jsonify(response.data), 200
    except Exception as e:
        return handle_error(e)

def create_order(data):
    try:
        supabase = get_supabase_client()
        response = supabase.table('orders').insert(data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return handle_error(e)

def update_order(order_id, data):
    try:
        supabase = get_supabase_client()
        response = supabase.table('orders').update(data).eq('id', order_id).execute()
        return jsonify(response.data[0] if response.data else None), 200
    except Exception as e:
        return handle_error(e)

def delete_order(order_id):
    try:
        supabase = get_supabase_client()
        supabase.table('orders').delete().eq('id', order_id).execute()
        return jsonify({'message': 'Order deleted'}), 200
    except Exception as e:
        return handle_error(e)

# Messages
def get_messages(message_id=None):
    try:
        supabase = get_supabase_client()
        if message_id:
            response = supabase.table('messages').select('*').eq('id', message_id).execute()
            data = response.data
            return jsonify(data[0] if data else None), 200 if data else 404
        else:
            response = supabase.table('messages').select('*').execute()
            return jsonify(response.data), 200
    except Exception as e:
        return handle_error(e)

def create_message(data):
    try:
        supabase = get_supabase_client()
        response = supabase.table('messages').insert(data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return handle_error(e)

def delete_message(message_id):
    try:
        supabase = get_supabase_client()
        supabase.table('messages').delete().eq('id', message_id).execute()
        return jsonify({'message': 'Message deleted'}), 200
    except Exception as e:
        return handle_error(e)

# Payments
def get_payments(payment_id=None):
    try:
        supabase = get_supabase_client()
        if payment_id:
            response = supabase.table('payments').select('*').eq('id', payment_id).execute()
            data = response.data
            return jsonify(data[0] if data else None), 200 if data else 404
        else:
            response = supabase.table('payments').select('*').execute()
            return jsonify(response.data), 200
    except Exception as e:
        return handle_error(e)

def create_payment(data):
    try:
        supabase = get_supabase_client()
        response = supabase.table('payments').insert(data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return handle_error(e)

def update_payment(payment_id, data):
    try:
        supabase = get_supabase_client()
        response = supabase.table('payments').update(data).eq('id', payment_id).execute()
        return jsonify(response.data[0] if response.data else None), 200
    except Exception as e:
        return handle_error(e)

def delete_payment(payment_id):
    try:
        supabase = get_supabase_client()
        supabase.table('payments').delete().eq('id', payment_id).execute()
        return jsonify({'message': 'Payment deleted'}), 200
    except Exception as e:
        return handle_error(e)
