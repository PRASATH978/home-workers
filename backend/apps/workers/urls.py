from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('nearby/', views.NearbyWorkersView.as_view(), name='workers-nearby'),
    path('<int:pk>/', views.WorkerPublicProfileView.as_view(), name='worker-public-profile'),

    # Worker (own profile)
    path('profile/', views.WorkerProfileView.as_view(), name='worker-profile'),
    path('profile/toggle-availability/', views.ToggleAvailabilityView.as_view(), name='toggle-availability'),
    path('profile/documents/', views.WorkerDocumentView.as_view(), name='worker-documents'),
    path('profile/availability/', views.WorkerAvailabilityView.as_view(), name='worker-availability'),

    # Admin only
    path('all/', views.AdminWorkerListView.as_view(), name='admin-workers-all'),
    path('bookings-all/', views.AdminAllBookingsView.as_view(), name='admin-bookings-all'),
    path('<int:pk>/verify/', views.WorkerVerifyView.as_view(), name='worker-verify'),
]
