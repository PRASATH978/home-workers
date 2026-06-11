import math
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import WorkerProfile, WorkerDocument, WorkerAvailabilitySlot
from .serializers import (
    WorkerProfileSerializer, WorkerListSerializer,
    WorkerDocumentSerializer, WorkerAvailabilitySerializer,
)


def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(float(lat2) - float(lat1))
    dlon = math.radians(float(lon2) - float(lon1))
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(float(lat1)))
         * math.cos(math.radians(float(lat2)))
         * math.sin(dlon / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


class NearbyWorkersView(generics.ListAPIView):
    """
    Public endpoint — only verified + available workers.
    GET /api/v1/workers/nearby/?service=plumber&lat=12.9&lng=77.5&radius=20
    """
    serializer_class = WorkerListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        service_slug = self.request.query_params.get('service')
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius = float(self.request.query_params.get('radius', 9999))

        qs = WorkerProfile.objects.filter(
            verification_status='verified',
            is_available=True,
        ).select_related('user').prefetch_related('services')

        if service_slug:
            qs = qs.filter(services__slug=service_slug).distinct()

        workers = list(qs)

        if lat and lng:
            for w in workers:
                if w.user.latitude and w.user.longitude:
                    w.distance_km = haversine(lat, lng, w.user.latitude, w.user.longitude)
                else:
                    w.distance_km = 999
            if self.request.query_params.get('radius'):
                workers = [w for w in workers if w.distance_km <= radius]
        else:
            for w in workers:
                w.distance_km = None

        workers.sort(key=lambda w: (
            0 if w.is_featured else 1,
            -w.avg_rating,
            w.distance_km if w.distance_km is not None else 999,
        ))

        return workers


class AdminWorkerListView(generics.ListAPIView):
    """
    Admin endpoint — ALL workers regardless of verification status.
    GET /api/v1/workers/all/
    """
    serializer_class = WorkerListSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    def list(self, request, *args, **kwargs):
        qs = WorkerProfile.objects.all().select_related('user').prefetch_related('services')
        # Attach distance_km = None for all (admin doesn't need distance)
        for w in qs:
            w.distance_km = None
        serializer = self.get_serializer(list(qs), many=True)
        return Response(serializer.data)


class AdminAllBookingsView(generics.ListAPIView):
    """
    Admin endpoint — ALL bookings from all customers.
    GET /api/v1/workers/bookings-all/  (mounted under workers for simplicity)
    """
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    def list(self, request, *args, **kwargs):
        from apps.bookings.models import Booking
        from apps.bookings.serializers import BookingSerializer
        qs = Booking.objects.all().select_related(
            'service', 'customer', 'worker__user'
        ).order_by('-created_at')
        serializer = BookingSerializer(qs, many=True)
        return Response(serializer.data)


class WorkerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = WorkerProfileSerializer

    def get_object(self):
        profile, _ = WorkerProfile.objects.get_or_create(user=self.request.user)
        return profile


class WorkerPublicProfileView(generics.RetrieveAPIView):
    queryset = WorkerProfile.objects.select_related('user').prefetch_related('services')
    serializer_class = WorkerProfileSerializer
    permission_classes = [permissions.AllowAny]


class WorkerDocumentView(generics.ListCreateAPIView):
    serializer_class = WorkerDocumentSerializer

    def get_queryset(self):
        return WorkerDocument.objects.filter(worker__user=self.request.user)

    def perform_create(self, serializer):
        profile, _ = WorkerProfile.objects.get_or_create(user=self.request.user)
        serializer.save(worker=profile)


class WorkerAvailabilityView(generics.ListCreateAPIView):
    serializer_class = WorkerAvailabilitySerializer

    def get_queryset(self):
        return WorkerAvailabilitySlot.objects.filter(worker__user=self.request.user)

    def perform_create(self, serializer):
        profile, _ = WorkerProfile.objects.get_or_create(user=self.request.user)
        serializer.save(worker=profile)


class ToggleAvailabilityView(APIView):
    def post(self, request):
        profile, _ = WorkerProfile.objects.get_or_create(user=request.user)
        profile.is_available = not profile.is_available
        profile.save(update_fields=['is_available'])
        return Response({'is_available': profile.is_available})


class WorkerVerifyView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        profile = get_object_or_404(WorkerProfile, pk=pk)
        new_status = request.data.get('verification_status')
        note = request.data.get('verification_note', '')
        if new_status not in ['verified', 'rejected', 'pending']:
            return Response({'error': 'Invalid status'}, status=400)
        profile.verification_status = new_status
        profile.verification_note = note
        profile.save(update_fields=['verification_status', 'verification_note'])
        return Response({
            'message': f'Worker {new_status}',
            'verification_status': new_status,
        })
