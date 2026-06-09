from django.urls import path
from . import views

urlpatterns = [
    path('booking/<int:booking_id>/', views.CreateBookingPaymentView.as_view(), name='create-booking-payment'),
    path('subscription/', views.CreateSubscriptionPaymentView.as_view(), name='create-subscription-payment'),
    path('verify/', views.VerifyPaymentView.as_view(), name='verify-payment'),
]
