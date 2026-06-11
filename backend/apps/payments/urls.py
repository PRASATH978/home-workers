from django.urls import path
from . import views

urlpatterns = [
    # Public — payment config (UPI ID, QR, bank details)
    path('config/',         views.PaymentConfigView.as_view(),          name='payment-config'),

    # Customer
    path('submit-proof/',   views.SubmitPaymentProofView.as_view(),     name='submit-payment-proof'),
    path('history/',        views.CustomerPaymentHistoryView.as_view(), name='payment-history'),

    # Admin
    path('admin/',                              views.AdminPaymentListView.as_view(),      name='admin-payments'),
    path('admin/stats/',                        views.AdminPaymentStatsView.as_view(),     name='admin-payment-stats'),
    path('admin/config/',                       views.AdminPaymentConfigView.as_view(),    name='admin-payment-config'),
    path('admin/<int:pk>/verify/',              views.AdminVerifyPaymentView.as_view(),    name='admin-verify-payment'),
    path('admin/<int:pk>/mark-worker-paid/',    views.AdminMarkWorkerPaidView.as_view(),   name='admin-mark-worker-paid'),
]
