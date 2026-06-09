from django.urls import path
from . import views

urlpatterns = [
    path('nearby/', views.NearbyWorkersView.as_view(), name='workers-nearby'),
    path('profile/', views.WorkerProfileView.as_view(), name='worker-profile'),
    path('profile/toggle-availability/', views.ToggleAvailabilityView.as_view(), name='toggle-availability'),
    path('profile/documents/', views.WorkerDocumentView.as_view(), name='worker-documents'),
    path('profile/availability/', views.WorkerAvailabilityView.as_view(), name='worker-availability'),
    path('<int:pk>/', views.WorkerPublicProfileView.as_view(), name='worker-public-profile'),
    path('<int:pk>/verify/', views.WorkerVerifyView.as_view(), name='worker-verify'),
]
