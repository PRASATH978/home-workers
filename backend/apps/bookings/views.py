import random
from django.db import models
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404

from .models import Booking, BookingReview
from .serializers import (
    BookingCreateSerializer, BookingSerializer,
    BookingReviewSerializer,
)
from apps.workers.models import WorkerProfile
from apps.notifications.services import NotificationService


class CustomerBookingListCreateView(generics.ListCreateAPIView):
    """Customer: list own bookings or create a new one"""
    pagination_class = None  # return plain list, no pagination wrapper

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingSerializer

    def get_queryset(self):
        return (
            Booking.objects
            .filter(customer=self.request.user)
            .select_related('service', 'worker__user')
            .order_by('-created_at')
        )

    def perform_create(self, serializer):
        booking = serializer.save(customer=self.request.user)
        self._notify_workers(booking)

    def _notify_workers(self, booking):
        workers = WorkerProfile.objects.filter(
            verification_status='verified',
            is_available=True,
            services=booking.service,
        ).select_related('user')[:20]
        for worker in workers:
            NotificationService.send_whatsapp(
                worker.user.phone,
                f"🔔 New {booking.service.name} job!\n"
                f"📍 {booking.address}\n"
                f"📝 {booking.problem_description[:100]}\n"
                f"Open app to accept."
            )


class CustomerBookingDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = BookingSerializer

    def get_queryset(self):
        return Booking.objects.filter(customer=self.request.user).select_related(
            'service', 'worker__user'
        )

    def destroy(self, request, *args, **kwargs):
        booking = self.get_object()
        if booking.status != Booking.Status.PENDING:
            return Response(
                {'error': 'Only pending bookings can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.cancel(reason='Cancelled by customer')
        return Response({'message': 'Booking cancelled.'})


class WorkerJobListView(generics.ListAPIView):
    """Worker: available jobs or their own jobs"""
    serializer_class = BookingSerializer
    pagination_class = None

    def get_queryset(self):
        # Return empty queryset if user has no worker profile
        try:
            profile = WorkerProfile.objects.get(user=self.request.user)
        except WorkerProfile.DoesNotExist:
            return Booking.objects.none()

        filter_type = self.request.query_params.get('filter', 'available')

        if filter_type == 'available':
            return (
                Booking.objects
                .filter(
                    status=Booking.Status.PENDING,
                    service__in=profile.services.all(),
                )
                .select_related('service', 'customer')
                .order_by('-created_at')
            )
        elif filter_type == 'mine':
            return (
                Booking.objects
                .filter(worker=profile)
                .select_related('service', 'customer')
                .order_by('-created_at')
            )
        return Booking.objects.none()


class WorkerJobActionView(APIView):
    """Worker accepts / starts / completes a job"""

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        profile = get_object_or_404(WorkerProfile, user=request.user)
        action = request.data.get('action')

        if action == 'accept':
            if booking.status != Booking.Status.PENDING:
                return Response({'error': 'Job is no longer available.'}, status=400)
            booking.accept(profile)
            NotificationService.send_whatsapp(
                booking.customer.phone,
                f"✅ {profile.user.name} accepted your {booking.service.name} request!\n"
                f"📞 {profile.user.phone}"
            )
            return Response({
                'message': 'Job accepted.',
                'booking': BookingSerializer(booking).data,
            })

        elif action == 'start':
            if booking.status != Booking.Status.ACCEPTED or booking.worker != profile:
                return Response({'error': 'Cannot start this job.'}, status=400)
            booking.start()
            otp = str(random.randint(1000, 9999))
            booking.completion_otp = otp
            booking.save(update_fields=['completion_otp'])
            NotificationService.send_sms(
                booking.customer.phone,
                f"Your {booking.service.name} job has started. Share OTP {otp} with the worker when done."
            )
            return Response({'message': 'Job started.'})

        elif action == 'complete':
            otp = request.data.get('otp')
            if booking.worker != profile:
                return Response({'error': 'Not your job.'}, status=403)
            if booking.completion_otp and booking.completion_otp != str(otp):
                return Response({'error': 'Invalid completion OTP.'}, status=400)
            final_price = request.data.get('final_price')
            booking.complete(final_price=int(final_price) if final_price else None)
            NotificationService.send_whatsapp(
                booking.customer.phone,
                f"✅ Your {booking.service.name} job is completed!\n"
                f"Amount: ₹{booking.final_price or 'TBD'}\n"
                f"Please rate your experience."
            )
            return Response({'message': 'Job completed.'})

        return Response({'error': 'Invalid action. Use: accept, start, complete'}, status=400)


class BookingReviewView(generics.CreateAPIView):
    serializer_class = BookingReviewSerializer

    def perform_create(self, serializer):
        booking = get_object_or_404(
            Booking, pk=self.kwargs['pk'], customer=self.request.user
        )
        if booking.status != Booking.Status.COMPLETED:
            raise PermissionDenied('Can only review completed bookings.')
        if hasattr(booking, 'review'):
            raise PermissionDenied('Already reviewed.')
        serializer.save(
            booking=booking,
            customer=self.request.user,
            worker=booking.worker,
        )


class BookingDetailView(generics.RetrieveAPIView):
    """Accessible by both customer and assigned worker"""
    serializer_class = BookingSerializer

    def get_queryset(self):
        user = self.request.user
        worker_profile = getattr(user, 'worker_profile', None)
        if worker_profile:
            return Booking.objects.filter(
                models.Q(customer=user) | models.Q(worker=worker_profile)
            ).select_related('service', 'worker__user')
        return Booking.objects.filter(customer=user).select_related('service', 'worker__user')
