from django.urls import path
from . import views

urlpatterns = [
    # Auth endpoints
    path('auth/session/', views.auth_session, name='auth-session'),
    path('auth/logout/', views.auth_logout, name='auth-logout'),

    # Company endpoints
    path('companies/', views.list_companies, name='list-companies'),
    path('companies/', views.create_company, name='create-company'),
    path('companies/<str:company_id>/', views.company_detail, name='company-detail'),
    path('companies/<str:company_id>/members/', views.company_members, name='company-members'),

    # Bills endpoints
    path('companies/<str:company_id>/bills/', views.list_create_bills, name='list-create-bills'),
    path('companies/<str:company_id>/bills/<str:bill_id>/', views.bill_detail, name='bill-detail'),

    # Chart of Accounts endpoints
    path('companies/<str:company_id>/chart-of-accounts/', views.list_create_chart_of_accounts, name='list-create-accounts'),
    path('companies/<str:company_id>/chart-of-accounts/<str:account_id>/', views.chart_of_account_detail, name='account-detail'),

    # Journal Entries endpoints
    path('companies/<str:company_id>/journal-entries/', views.list_create_journal_entries, name='list-create-entries'),
    path('companies/<str:company_id>/journal-entries/<str:entry_id>/', views.journal_entry_detail, name='entry-detail'),
    path('companies/<str:company_id>/journal-entries/<str:entry_id>/post/', views.post_journal_entry, name='post-entry'),

    # Items endpoints
    path('companies/<str:company_id>/items/', views.list_create_items, name='list-create-items'),
    path('companies/<str:company_id>/items/<str:item_id>/', views.item_detail, name='item-detail'),

    # Tax Rates endpoints
    path('companies/<str:company_id>/tax-rates/', views.list_create_tax_rates, name='list-create-tax-rates'),
    path('companies/<str:company_id>/tax-rates/<str:rate_id>/', views.tax_rate_detail, name='tax-rate-detail'),
]
