from flask import Blueprint, request, jsonify
from app.view import (
    get_products, create_product, update_product, delete_product,
    get_bookings, create_booking, update_booking, delete_booking,
    get_availability, create_availability, update_availability, delete_availability,
    get_orders, create_order, update_order, delete_order,
    get_messages, create_message, delete_message,
    get_payments, create_payment, update_payment, delete_payment
)
from api.admin_views import admin_login, admin_logout, admin_verify, admin_change_password, debug_sessions
from api.admin_dashboard import (
    get_dashboard_stats,
    get_products as get_admin_products,
    create_product as create_admin_product,
    update_product as update_admin_product,
    delete_product as delete_admin_product
)
from api.admin_rentals import (
    get_admin_bookings, update_admin_booking,
    get_blocked_dates, create_blocked_date, delete_blocked_date
)
from api.admin_delivery import (
    get_delivery_options, get_admin_delivery_options,
    create_delivery_option, update_delivery_option
)
from api.admin_settings import get_settings, update_settings
from api.admin_orders import get_admin_orders, update_admin_order

def register_routes(app):
    # ==================== ADMIN AUTHENTICATION ====================
    # All frontend admin requests go through these endpoints only
    # Frontend stores token in localStorage and sends with each request

    @app.route('/api/admin/login/', methods=['POST'])
    def login_route():
        return admin_login()

    @app.route('/api/admin/logout/', methods=['POST'])
    def logout_route():
        return admin_logout()

    @app.route('/api/admin/verify/', methods=['GET'])
    def verify_route():
        return admin_verify()

    @app.route('/api/admin/change-password/', methods=['POST'])
    def change_password_route():
        return admin_change_password()

    @app.route('/api/admin/debug/sessions', methods=['GET'])
    def debug_sessions_route():
        return debug_sessions()

    @app.route('/api/admin/dashboard/stats', methods=['GET'])
    def dashboard_stats_route():
        return get_dashboard_stats()

    @app.route('/api/admin/products', methods=['GET', 'POST'])
    def admin_products_list():
        if request.method == 'POST':
            return create_admin_product()
        return get_admin_products()

    @app.route('/api/admin/products/<product_id>', methods=['GET', 'PUT', 'DELETE'])
    def admin_products_detail(product_id):
        if request.method == 'PUT':
            return update_admin_product(product_id)
        elif request.method == 'DELETE':
            return delete_admin_product(product_id)
        # GET is handled by the list endpoint

    # ==================== ADMIN RENTALS (bookings + global calendar) ====================
    @app.route('/api/admin/bookings', methods=['GET'])
    def admin_bookings_list():
        return get_admin_bookings()

    @app.route('/api/admin/bookings/<booking_id>', methods=['PUT'])
    def admin_bookings_detail(booking_id):
        return update_admin_booking(booking_id)

    @app.route('/api/blocked-dates', methods=['GET'])
    def blocked_dates_list():
        return get_blocked_dates()

    @app.route('/api/admin/blocked-dates', methods=['POST'])
    def admin_blocked_dates_create():
        return create_blocked_date()

    @app.route('/api/admin/blocked-dates/<blocked_date_id>', methods=['DELETE'])
    def admin_blocked_dates_delete(blocked_date_id):
        return delete_blocked_date(blocked_date_id)

    # ==================== DELIVERY OPTIONS ====================
    @app.route('/api/delivery-options', methods=['GET'])
    def delivery_options_list():
        return get_delivery_options()

    @app.route('/api/admin/delivery-options', methods=['GET', 'POST'])
    def admin_delivery_options_list():
        if request.method == 'POST':
            return create_delivery_option()
        return get_admin_delivery_options()

    @app.route('/api/admin/delivery-options/<option_id>', methods=['PUT'])
    def admin_delivery_options_detail(option_id):
        return update_delivery_option(option_id)

    # ==================== ADMIN ORDERS ====================
    @app.route('/api/admin/orders', methods=['GET'])
    def admin_orders_list():
        return get_admin_orders()

    @app.route('/api/admin/orders/<order_id>', methods=['PUT'])
    def admin_orders_detail(order_id):
        return update_admin_order(order_id)

    # ==================== SITE SETTINGS ====================
    @app.route('/api/settings', methods=['GET'])
    def settings_get():
        return get_settings()

    @app.route('/api/admin/settings', methods=['PUT'])
    def admin_settings_update():
        return update_settings()

    # ==================== PRODUCTS ====================
    @app.route('/api/products', methods=['GET'])
    def products_list():
        return get_products()

    @app.route('/api/products', methods=['POST'])
    def products_create():
        return create_product(request.get_json(silent=True))

    @app.route('/api/products/<product_id>', methods=['GET', 'PUT', 'DELETE'])
    def products_detail(product_id):
        if request.method == 'PUT':
            return update_product(product_id, request.get_json(silent=True))
        elif request.method == 'DELETE':
            return delete_product(product_id)
        return get_products(product_id)

    # Bookings
    @app.route('/api/bookings', methods=['GET', 'POST'])
    def bookings_list():
        if request.method == 'POST':
            return create_booking(request.get_json(silent=True))
        return get_bookings()

    @app.route('/api/bookings/<booking_id>', methods=['GET', 'PUT', 'DELETE'])
    def bookings_detail(booking_id):
        if request.method == 'PUT':
            return update_booking(booking_id, request.get_json(silent=True))
        elif request.method == 'DELETE':
            return delete_booking(booking_id)
        return get_bookings(booking_id)

    # Rental Availability
    @app.route('/api/availability', methods=['GET', 'POST'])
    def availability_list():
        if request.method == 'POST':
            return create_availability(request.get_json(silent=True))
        return get_availability()

    @app.route('/api/availability/<availability_id>', methods=['GET', 'PUT', 'DELETE'])
    def availability_detail(availability_id):
        if request.method == 'PUT':
            return update_availability(availability_id, request.get_json(silent=True))
        elif request.method == 'DELETE':
            return delete_availability(availability_id)
        return get_availability(availability_id)

    # Orders
    @app.route('/api/orders', methods=['GET', 'POST'])
    def orders_list():
        if request.method == 'POST':
            return create_order(request.get_json(silent=True))
        return get_orders()

    @app.route('/api/orders/<order_id>', methods=['GET', 'PUT', 'DELETE'])
    def orders_detail(order_id):
        if request.method == 'PUT':
            return update_order(order_id, request.get_json(silent=True))
        elif request.method == 'DELETE':
            return delete_order(order_id)
        return get_orders(order_id)

    # Messages
    @app.route('/api/messages', methods=['GET', 'POST'])
    def messages_list():
        if request.method == 'POST':
            return create_message(request.get_json(silent=True))
        return get_messages()

    @app.route('/api/messages/<message_id>', methods=['GET', 'DELETE'])
    def messages_detail(message_id):
        if request.method == 'DELETE':
            return delete_message(message_id)
        return get_messages(message_id)

    # Payments
    @app.route('/api/payments', methods=['GET', 'POST'])
    def payments_list():
        if request.method == 'POST':
            return create_payment(request.get_json(silent=True))
        return get_payments()

    @app.route('/api/payments/<payment_id>', methods=['GET', 'PUT', 'DELETE'])
    def payments_detail(payment_id):
        if request.method == 'PUT':
            return update_payment(payment_id, request.get_json(silent=True))
        elif request.method == 'DELETE':
            return delete_payment(payment_id)
        return get_payments(payment_id)
