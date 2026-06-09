import math
from rest_framework import generics, status, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import WorkerProfile, WorkerDocument, WorkerAvailabilitySlot
from .serializers import (
    WorkerProfileSerializer, WorkerListSerializer,
    WorkerDocumentSerializer, WorkerAvailabilitySerializer,
)


def haversine(lat1, lon1, lat2, lon2):
    """Calculate distance in km between two geo points."""
    R = 6371
    dlat = math.radians(float(lat2) - float(lat1))
    dlon = math.radians(float(lon2) - float(lon1))
    a = math.sin(dlat/2)**2 + math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))


class NearbyWorkersView(generics.ListAPIView):
    """
    GET /api/v1/workers/nearby/?service=plumber&lat=12.9&lng=77.5&radius=10
    Returns workers sorted by: featured → rating → distance
    """
    serializer_class = WorkerListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        service_slug = self.request.query_params.get('service')
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius = float(self.request.query_params.get('radius', 20))

        qs = WorkerProfile.objects.filter(
            verification_status='verified',
            is_available=True,
        ).select_related('user').prefetch_related('services')

        if service_slug:
            qs = qs.filter(services__slug=service_slug)

        workers = list(qs)

        # Attach distance if lat/lng provided
        if lat and lng:
            for w in workers:
                if w.user.latitude and w.user.longitude:
                    w.distance_km = haversine(lat, lng, w.user.latitude, w.user.longitude)
                else:
                    w.distance_km = 999
            workers = [w for w in workers if w.distance_km <= radius]

        # Sort: featured first, then by rating desc
        workers.sort(key=lambda w: (
            0 if w.is_featured else 1,
            -w.avg_rating,
            getattr(w, 'distance_km', 999),
        ))

        return workers


class WorkerProfileView(generics.RetrieveUpdateAPIView):
    """Get or update own worker profile"""
    serializer_class = WorkerProfileSerializer

    def get_object(self):
        profile, _ = WorkerProfile.objects.get_or_create(user=self.request.user)
        return profile


class WorkerPublicProfileView(generics.RetrieveAPIView):
    """Public profile of a worker by ID"""
    queryset = WorkerProfile.objects.filter(verification_status='verified')
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
    """Quick toggle: worker goes online/offline"""
    def post(self, request):
        profile, _ = WorkerProfile.objects.get_or_create(user=request.user)
        profile.is_available = not profile.is_available
        profile.save(update_fields=['is_available'])
        return Response({'is_available': profile.is_available})


class WorkerVerifyView(APIView):
    """Admin verifies or rejects a worker"""
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        profile = get_object_or_404(WorkerProfile, pk=pk)
        status = request.data.get('verification_status')
        note = request.data.get('verification_note', '')
        if status not in ['verified', 'rejected', 'pending']:
            return Response({'error': 'Invalid status'}, status=400)
        profile.verification_status = status
        profile.verification_note = note
        profile.save(update_fields=['verification_status', 'verification_note'])
        return Response({'message': f'Worker {status}', 'verification_status': status})
