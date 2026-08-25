from django.urls import path
from . import views

urlpatterns = [
    # Product endpoints
    path('products/', views.list_products, name='list-products'),
    path('products/<str:product_id>/', views.product_detail, name='product-detail'),

    # Rental availability endpoints
    path('products/<str:product_id>/availability/', views.get_availability, name='get-availability'),

    # Booking endpoints
    path('bookings/', views.create_booking, name='create-booking'),
    path('bookings/<str:booking_id>/', views.booking_detail, name='booking-detail'),

    # Order endpoints
    path('orders/', views.create_order, name='create-order'),
    path('orders/<str:order_id>/', views.order_detail, name='order-detail'),

    # Message endpoints
    path('messages/', views.create_message, name='create-message'),
    path('messages/<str:related_id>/', views.list_messages, name='list-messages'),

    # Payment endpoints
    path('payments/', views.create_payment, name='create-payment'),
    path('payments/<str:payment_id>/', views.payment_detail, name='payment-detail'),
]
