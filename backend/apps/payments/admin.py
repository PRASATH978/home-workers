from django.contrib import admin
from .models import Payment, PlatformPaymentConfig

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display  = ['id', 'get_customer', 'get_booking', 'method', 'status', 'amount', 'commission_amount', 'worker_paid', 'created_at']
    list_filter   = ['status', 'method', 'worker_paid']
    search_fields = ['user__name', 'user__phone', 'transaction_id']
    ordering      = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'verified_at', 'worker_paid_at']

    def get_customer(self, obj):
        return f"{obj.user.name} ({obj.user.phone})"
    get_customer.short_description = 'Customer'

    def get_booking(self, obj):
        return f"#{obj.booking.id}" if obj.booking else '—'
    get_booking.short_description = 'Booking'

@admin.register(PlatformPaymentConfig)
class PlatformPaymentConfigAdmin(admin.ModelAdmin):
    list_display = ['upi_id', 'upi_name', 'bank_name', 'is_active', 'updated_at']

    def has_add_permission(self, request):
        return not PlatformPaymentConfig.objects.exists()