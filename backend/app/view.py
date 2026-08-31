from flask import jsonify
from app.supabase_client import get_supabase_client, SupabaseError
import traceback

def handle_error(error):
    """
    Turns any exception raised while talking to Supabase into a clean JSON
    response. SupabaseError carries a real HTTP status code (e.g. 503 when
    Supabase itself is unreachable, 409 on a unique-constraint conflict) -
    use that instead of always answering 400. Falls back to 400 for
    anything else (bad input that got as far as a Python exception, etc).
    The raw exception text goes in `details` for debugging; `error` is a
    short summary so a client (or the person testing this by hand) isn't
    stuck parsing a raw Postgres/PostgREST error string to know what
    happened.
    """
    print(f"ERROR: {error}")
    print(traceback.format_exc())

    if isinstance(error, SupabaseError):
        status = error.status_code
        if status == 503:
            summary = 'The database is temporarily unavailable. Please try again.'
        elif status == 409:
            summary = 'This conflicts with existing data.'
        else:
            summary = 'The database rejected this request.'
        return jsonify({'error': summary, 'details': error.text}), status

    return jsonify({'error': 'Something went wrong processing this request.', 'details': str(error)}), 400


def require_body(data):
    """Returns an error response if the request body is missing/empty,
    otherwise None. Guards against the three ways a bad request currently
    reaches a view function: no body at all, a literal JSON `null`, or an
    empty object with none of the required fields."""
    if not data:
        return jsonify({'error': 'A JSON request body is required.'}), 400
    return None

# Products
def get_products(product_id=None):
    try:
        supabase = get_supabase_client()
        if product_id:
            response = supabase.table('products').select('*').eq('id', product_id).execute()
            data = response.data
            return jsonify(data[0] if data else {'error': 'Product not found'}), 200 if data else 404
        else:
            response = supabase.table('products').select('*').execute()
            return jsonify(response.data), 200
    except Exception as e:
        return handle_error(e)

def create_product(data):
    error = require_body(data)
    if error:
        return error
    if not data.get('name'):
        return jsonify({'error': 'name is required'}), 400
    try:
        supabase = get_supabase_client()
        response = supabase.table('products').insert(data).execute()
        if not response.data:
            return jsonify({'error': 'Product was not created'}), 400
        return jsonify(response.data[0]), 201
    except Exception as e:
        return handle_error(e)

def update_product(product_id, data):
    error = require_body(data)
    if error:
        return error
    try:
        supabase = get_supabase_client()
        response = supabase.table('products').update(data).eq('id', product_id).execute()
        if not response.data:
            return jsonify({'error': 'Product not found'}), 404
        return jsonify(response.data[0]), 200
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
            return jsonify(data[0] if data else {'error': 'Booking not found'}), 200 if data else 404
        else:
            response = supabase.table('bookings').select('*').execute()
            return jsonify(response.data), 200
    except Exception as e:
        return handle_error(e)

def create_booking(data):
    """
    Claims the date before creating the booking, not after. blocked_dates.date
    is UNIQUE, so this insert is the actual concurrency guard: two simultaneous
    requests for the same date will have one succeed and one hit a 409 from
    Postgres, before either has created a booking row. Creating the booking
    first (the old order) let two concurrent requests both pass a plain
    SELECT check and both insert bookings, with only one ever getting a
    blocked_dates row.
    """
    error = require_body(data)
    if error:
        return error

    required = ('product_id', 'customer_name', 'contact', 'event_date')
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'error': f"Missing required field(s): {', '.join(missing)}"}), 400

    supabase = get_supabase_client()
    event_date = data.get('event_date')
    claim = None

    try:
        try:
            claim = supabase.table('blocked_dates').insert({
                'date': event_date,
                'reason': f"Booking - {data.get('customer_name', 'customer')}",
            }).execute().data[0]
        except SupabaseError as e:
            if e.status_code == 409:
                return jsonify({'error': 'That date is no longer available'}), 409
            raise

        try:
            booking_result = supabase.table('bookings').insert(data).execute()
            if not booking_result.data:
                raise Exception('Booking was not created')
            booking = booking_result.data[0]
        except Exception:
            # Booking failed after the date was claimed - release it so the
            # date doesn't stay stuck as blocked with nothing behind it.
            if claim:
                supabase.table('blocked_dates').delete().eq('id', claim['id']).execute()
            raise

        supabase.table('blocked_dates').update({'booking_id': booking['id']}).eq('id', claim['id']).execute()

        return jsonify(booking), 201
    except Exception as e:
        return handle_error(e)

def update_booking(booking_id, data):
    error = require_body(data)
    if error:
        return error
    try:
        supabase = get_supabase_client()
        response = supabase.table('bookings').update(data).eq('id', booking_id).execute()
        if not response.data:
            return jsonify({'error': 'Booking not found'}), 404
        return jsonify(response.data[0]), 200
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
            return jsonify(data[0] if data else {'error': 'Availability record not found'}), 200 if data else 404
        else:
            response = supabase.table('rental_availability').select('*').execute()
            return jsonify(response.data), 200
    except Exception as e:
        return handle_error(e)

def create_availability(data):
    error = require_body(data)
    if error:
        return error
    try:
        supabase = get_supabase_client()
        response = supabase.table('rental_availability').insert(data).execute()
        if not response.data:
            return jsonify({'error': 'Availability record was not created'}), 400
        return jsonify(response.data[0]), 201
    except Exception as e:
        return handle_error(e)

def update_availability(availability_id, data):
    error = require_body(data)
    if error:
        return error
    try:
        supabase = get_supabase_client()
        response = supabase.table('rental_availability').update(data).eq('id', availability_id).execute()
        if not response.data:
            return jsonify({'error': 'Availability record not found'}), 404
        return jsonify(response.data[0]), 200
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
            return jsonify(data[0] if data else {'error': 'Order not found'}), 200 if data else 404
        else:
            response = supabase.table('orders').select('*').execute()
            return jsonify(response.data), 200
    except Exception as e:
        return handle_error(e)

def create_order(data):
    error = require_body(data)
    if error:
        return error
    required = ('customer_name', 'contact')
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'error': f"Missing required field(s): {', '.join(missing)}"}), 400
    try:
        supabase = get_supabase_client()
        response = supabase.table('orders').insert(data).execute()
        if not response.data:
            return jsonify({'error': 'Order was not created'}), 400
        return jsonify(response.data[0]), 201
    except Exception as e:
        return handle_error(e)

def update_order(order_id, data):
    error = require_body(data)
    if error:
        return error
    try:
        supabase = get_supabase_client()
        response = supabase.table('orders').update(data).eq('id', order_id).execute()
        if not response.data:
            return jsonify({'error': 'Order not found'}), 404
        return jsonify(response.data[0]), 200
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
            return jsonify(data[0] if data else {'error': 'Message not found'}), 200 if data else 404
        else:
            response = supabase.table('messages').select('*').execute()
            return jsonify(response.data), 200
    except Exception as e:
        return handle_error(e)

def create_message(data):
    error = require_body(data)
    if error:
        return error
    required = ('sender_name', 'content')
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'error': f"Missing required field(s): {', '.join(missing)}"}), 400
    try:
        supabase = get_supabase_client()
        response = supabase.table('messages').insert(data).execute()
        if not response.data:
            return jsonify({'error': 'Message was not created'}), 400
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
            return jsonify(data[0] if data else {'error': 'Payment not found'}), 200 if data else 404
        else:
            response = supabase.table('payments').select('*').execute()
            return jsonify(response.data), 200
    except Exception as e:
        return handle_error(e)

def create_payment(data):
    error = require_body(data)
    if error:
        return error
    try:
        supabase = get_supabase_client()
        response = supabase.table('payments').insert(data).execute()
        if not response.data:
            return jsonify({'error': 'Payment was not created'}), 400
        return jsonify(response.data[0]), 201
    except Exception as e:
        return handle_error(e)

def update_payment(payment_id, data):
    error = require_body(data)
    if error:
        return error
    try:
        supabase = get_supabase_client()
        response = supabase.table('payments').update(data).eq('id', payment_id).execute()
        if not response.data:
            return jsonify({'error': 'Payment not found'}), 404
        return jsonify(response.data[0]), 200
    except Exception as e:
        return handle_error(e)

def delete_payment(payment_id):
    try:
        supabase = get_supabase_client()
        supabase.table('payments').delete().eq('id', payment_id).execute()
        return jsonify({'message': 'Payment deleted'}), 200
    except Exception as e:
        return handle_error(e)
