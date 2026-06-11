from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API v1
    path('api/v1/auth/',          include('apps.accounts.urls')),
    path('api/v1/services/',      include('apps.services.urls')),
    path('api/v1/workers/',       include('apps.workers.urls')),
    path('api/v1/bookings/',      include('apps.bookings.urls')),
    path('api/v1/payments/',      include('apps.payments.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),

    # API Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/',   SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

# Serve uploaded media files in local development
if settings.DEBUG:
    MEDIA_ROOT = getattr(settings, 'MEDIA_ROOT', None)
    MEDIA_URL  = getattr(settings, 'MEDIA_URL', '/media/')
    if MEDIA_ROOT:
        urlpatterns += static(MEDIA_URL, document_root=MEDIA_ROOT)