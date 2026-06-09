from django.urls import path
from . import views

urlpatterns = [
    # Customer
    path('', views.CustomerBookingListCreateView.as_view(), name='booking-list-create'),
    path('<int:pk>/', views.CustomerBookingDetailView.as_view(), name='booking-detail'),
    path('<int:pk>/review/', views.BookingReviewView.as_view(), name='booking-review'),

    # Worker
    path('jobs/', views.WorkerJobListView.as_view(), name='worker-jobs'),
    path('jobs/<int:pk>/action/', views.WorkerJobActionView.as_view(), name='worker-job-action'),
]
