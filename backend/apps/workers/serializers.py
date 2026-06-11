from rest_framework import serializers
from .models import WorkerProfile, WorkerDocument, WorkerAvailabilitySlot
from apps.accounts.serializers import UserSerializer
from apps.services.serializers import ServiceCategorySerializer
from apps.services.models import ServiceCategory


class WorkerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    services = ServiceCategorySerializer(many=True, read_only=True)
    service_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=ServiceCategory.objects.all(),
        source='services',
        required=False,
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
            'verification_status', 'verification_note',
            'is_available', 'available_from', 'available_to',
            'service_radius_km',
            'total_jobs', 'avg_rating', 'rating_count',
            'subscription_plan', 'subscription_expires_at',
            'is_featured', 'is_pro',
            'created_at',
        ]
        read_only_fields = [
            'id', 'user', 'verification_status', 'verification_note',
            'total_jobs', 'avg_rating', 'rating_count',
            'subscription_plan', 'subscription_expires_at',
            'created_at',
        ]


class WorkerListSerializer(serializers.ModelSerializer):
    """Used for public listing AND admin listing"""
    name = serializers.CharField(source='user.name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    profile_photo = serializers.SerializerMethodField()
    city = serializers.CharField(source='user.city', read_only=True)
    avg_rating = serializers.FloatField(read_only=True)
    is_featured = serializers.BooleanField(read_only=True)
    service_names = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()
    # Include verification_status so admin pages can filter/display it
    verification_status = serializers.CharField(read_only=True)

    class Meta:
        model = WorkerProfile
        fields = [
            'id', 'name', 'phone', 'profile_photo', 'city',
            'service_names', 'experience_years',
            'is_available', 'avg_rating', 'rating_count',
            'total_jobs', 'is_featured',
            'subscription_plan', 'distance_km',
            'verification_status',
        ]

    def get_profile_photo(self, obj):
        try:
            if obj.user.profile_photo:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.user.profile_photo.url)
                return obj.user.profile_photo.url
        except Exception:
            pass
        return None

    def get_service_names(self, obj):
        return [s.name for s in obj.services.all()]

    def get_distance_km(self, obj):
        return getattr(obj, 'distance_km', None)


class WorkerDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerDocument
        fields = ['id', 'title', 'file', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class WorkerAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerAvailabilitySlot
        fields = ['id', 'day_of_week', 'is_available', 'from_time', 'to_time']
