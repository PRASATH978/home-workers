from django.contrib import admin
from .models import Booking, BookingReview

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display  = ['id', 'get_service', 'get_customer', 'get_worker', 'status', 'payment_status', 'final_price', 'created_at']
    list_filter   = ['status', 'payment_status']
    search_fields = ['customer__name', 'customer__phone', 'worker__user__name', 'service__name']
    ordering      = ['-created_at']
    readonly_fields = ['completion_otp', 'created_at', 'accepted_at', 'started_at', 'completed_at']

    def get_service(self, obj):
        return obj.service.name if obj.service else '—'
    get_service.short_description = 'Service'

    def get_customer(self, obj):
        return f"{obj.customer.name} ({obj.customer.phone})" if obj.customer else '—'
    get_customer.short_description = 'Customer'

    def get_worker(self, obj):
        return obj.worker.user.name if obj.worker else 'Unassigned'
    get_worker.short_description = 'Worker'

@admin.register(BookingReview)
class BookingReviewAdmin(admin.ModelAdmin):
    list_display  = ['booking', 'rating', 'created_at']
    list_filter   = ['rating']
    ordering      = ['-created_at']
