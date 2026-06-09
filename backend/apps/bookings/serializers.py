from rest_framework import serializers
from .models import Booking, BookingReview
from apps.services.serializers import ServiceCategorySerializer
from apps.accounts.serializers import UserSerializer
from apps.workers.serializers import WorkerListSerializer


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            'service', 'problem_description', 'address',
            'latitude', 'longitude', 'scheduled_at', 'photos',
        ]


class BookingSerializer(serializers.ModelSerializer):
    service = ServiceCategorySerializer(read_only=True)
    customer = UserSerializer(read_only=True)
    worker = WorkerListSerializer(read_only=True)
    has_review = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'customer', 'worker', 'service',
            'problem_description', 'address',
            'latitude', 'longitude', 'scheduled_at', 'photos',
            'status', 'payment_status',
            'quoted_price', 'final_price', 'commission_amount',
            'created_at', 'accepted_at', 'completed_at',
            'has_review',
        ]

    def get_has_review(self, obj):
        return hasattr(obj, 'review')


class BookingStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Booking.Status.choices)
    final_price = serializers.IntegerField(required=False, min_value=0)
    cancel_reason = serializers.CharField(required=False, allow_blank=True)


class BookingReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingReview
        fields = ['id', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at']
