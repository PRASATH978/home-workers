from django.contrib import admin
from .models import ServiceCategory

@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display  = ['name', 'slug', 'base_price', 'sort_order', 'is_active']
    list_filter   = ['is_active']
    search_fields = ['name', 'slug']
    ordering      = ['sort_order', 'name']
    prepopulated_fields = {'slug': ('name',)}
