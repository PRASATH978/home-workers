from rest_framework import serializers
from .models import WorkerProfile, WorkerDocument, WorkerAvailabilitySlot
from apps.accounts.serializers import UserSerializer
from apps.services.serializers import ServiceCategorySerializer


class WorkerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    services = ServiceCategorySerializer(many=True, read_only=True)
    service_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True,
        queryset=__import__('apps.services.models', fromlist=['ServiceCategory']).ServiceCategory.objects.all(),
        source='services'
    )
    avg_rating = serializers.FloatField(read_only=True)
    is_featured = serializers.BooleanField(read_only=True)
    is_pro = serializers.BooleanField(read_only=True)

    class Meta:
        model = WorkerProfile
        fields = [
            'id', 'user', 'services', 'service_ids',
            'bio', 'experience_years',
            'id_proof_type', 'id_proof_image',
            'verification_status',
            'is_available', 'available_from', 'available_to',
            'service_radius_km',
            'total_jobs', 'avg_rating', 'rating_count',
            'subscription_plan', 'subscription_expires_at',
            'is_featured', 'is_pro',
            'created_at',
        ]
        read_only_fields = [
            'id', 'user', 'verification_status',
            'total_jobs', 'avg_rating', 'rating_count',
            'subscription_plan', 'subscription_expires_at',
            'created_at',
        ]


class WorkerListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing workers"""
    name = serializers.CharField(source='user.name')
    phone = serializers.CharField(source='user.phone')
    profile_photo = serializers.ImageField(source='user.profile_photo')
    city = serializers.CharField(source='user.city')
    avg_rating = serializers.FloatField(read_only=True)
    is_featured = serializers.BooleanField(read_only=True)
    service_names = serializers.SerializerMethodField()
    distance_km = serializers.FloatField(read_only=True, default=None)

    class Meta:
        model = WorkerProfile
        fields = [
            'id', 'name', 'phone', 'profile_photo', 'city',
            'service_names', 'experience_years',
            'is_available', 'avg_rating', 'rating_count',
            'total_jobs', 'is_featured',
            'subscription_plan', 'distance_km',
        ]

    def get_service_names(self, obj):
        return [s.name for s in obj.services.all()]


class WorkerDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerDocument
        fields = ['id', 'title', 'file', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class WorkerAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerAvailabilitySlot
        fields = ['id', 'day_of_week', 'is_available', 'from_time', 'to_time']
