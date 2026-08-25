from django.contrib import admin
from django.urls import path, include
from django.conf import settings

urlpatterns = [
    path('api/', include('api.urls')),
]

if settings.DEBUG:
    urlpatterns += [
        path('admin/', admin.site.urls),
    ]
