from rest_framework import serializers
from .models import ServiceCategory


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = [
            'id', 'name', 'slug', 'icon',
            'description', 'base_price', 'sort_order',
            'is_active', 'image',
        ]
