from django.contrib import admin
from .models import WorkerProfile, WorkerDocument, WorkerAvailabilitySlot

@admin.register(WorkerProfile)
class WorkerProfileAdmin(admin.ModelAdmin):
    list_display  = ['get_name', 'get_phone', 'verification_status', 'is_available', 'subscription_plan', 'total_jobs', 'avg_rating']
    list_filter   = ['verification_status', 'is_available', 'subscription_plan']
    search_fields = ['user__name', 'user__phone', 'user__city']
    ordering      = ['-created_at']
    readonly_fields = ['total_jobs', 'avg_rating', 'rating_count', 'created_at']

    def get_name(self, obj):
        return obj.user.name
    get_name.short_description = 'Name'

    def get_phone(self, obj):
        return obj.user.phone
    get_phone.short_description = 'Phone'

@admin.register(WorkerDocument)
class WorkerDocumentAdmin(admin.ModelAdmin):
    list_display = ['worker', 'title', 'uploaded_at']
    search_fields = ['worker__user__name']
