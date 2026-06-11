import hmac
import hashlib
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework.generics import ListAPIView
from rest_framework import serializers
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Payment, PlatformPaymentConfig
from apps.bookings.models import Booking
from apps.workers.models import WorkerProfile


# ─── Serializers ──────────────────────────────────────────────────────────────

class PaymentConfigSerializer(serializers.ModelSerializer):
    upi_qr_image_url = serializers.SerializerMethodField()

    class Meta:
        model = PlatformPaymentConfig
        fields = [
            'upi_id', 'upi_name', 'upi_qr_image_url',
            'bank_name', 'account_holder_name', 'account_number',
            'ifsc_code', 'branch_name', 'payment_instructions',
        ]

    def get_upi_qr_image_url(self, obj):
        request = self.context.get('request')
        if obj.upi_qr_image:
            try:
                url = obj.upi_qr_image.url
                return request.build_absolute_uri(url) if request else url
            except Exception:
                pass
        return None


class PaymentSerializer(serializers.ModelSerializer):
    booking_id        = serializers.IntegerField(source='booking.id',           read_only=True)
    service_name      = serializers.CharField(source='booking.service.name',    read_only=True)
    customer_name     = serializers.CharField(source='user.name',               read_only=True)
    customer_phone    = serializers.CharField(source='user.phone',              read_only=True)
    worker_name       = serializers.SerializerMethodField()
    screenshot_url    = serializers.SerializerMethodField()
    verified_by_name  = serializers.CharField(source='verified_by.name',        read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'booking_id', 'service_name',
            'customer_name', 'customer_phone', 'worker_name',
            'payment_type', 'method', 'status',
            'amount', 'commission_amount', 'worker_amount',
            'transaction_id', 'screenshot_url', 'customer_note',
            'verified_by_name', 'verified_at', 'rejection_reason', 'admin_note',
            'worker_paid', 'worker_paid_at', 'worker_paid_note',
            'created_at', 'updated_at',
        ]

    def get_worker_name(self, obj):
        if obj.booking and obj.booking.worker:
            return obj.booking.worker.user.name
        return None

    def get_screenshot_url(self, obj):
        request = self.context.get('request')
        if obj.payment_screenshot:
            try:
                url = obj.payment_screenshot.url
                return request.build_absolute_uri(url) if request else url
            except Exception:
                pass
        return None


# ─── Public: Get platform payment details ─────────────────────────────────────

class PaymentConfigView(APIView):
    """GET /api/v1/payments/config/ — returns UPI ID, QR, bank details"""

    def get(self, request):
        config = PlatformPaymentConfig.get_config()
        serializer = PaymentConfigSerializer(config, context={'request': request})
        return Response(serializer.data)


# ─── Customer: Submit UPI/Bank payment proof ──────────────────────────────────

class SubmitPaymentProofView(APIView):
    """
    POST /api/v1/payments/submit-proof/
    multipart/form-data:
      - booking_id
      - method: upi_qr | bank | cash
      - transaction_id
      - payment_screenshot (file)
      - customer_note (optional)
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        booking_id  = request.data.get('booking_id')
        method      = request.data.get('method', 'upi_qr')
        txn_id      = request.data.get('transaction_id', '').strip()
        screenshot  = request.FILES.get('payment_screenshot')
        note        = request.data.get('customer_note', '').strip()

        # Validate
        if not booking_id:
            return Response({'error': 'booking_id is required.'}, status=400)
        if method in ['upi_qr', 'bank'] and not txn_id:
            return Response({'error': 'Transaction ID is required for UPI/Bank payments.'}, status=400)
        if method in ['upi_qr', 'bank'] and not screenshot:
            return Response({'error': 'Payment screenshot is required.'}, status=400)

        try:
            booking = Booking.objects.get(pk=booking_id, customer=request.user)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found.'}, status=404)

        if booking.status != 'completed':
            return Response({'error': 'Job must be completed before payment.'}, status=400)

        # Prevent duplicate
        if hasattr(booking, 'payment') and booking.payment.status in ['verified', 'paid']:
            return Response({'error': 'Payment already verified for this booking.'}, status=400)

        # Create or update payment
        payment, _ = Payment.objects.get_or_create(
            booking=booking,
            defaults={
                'user':         request.user,
                'payment_type': Payment.Type.BOOKING,
                'amount':       booking.final_price or 0,
            }
        )
        payment.method         = method
        payment.amount         = booking.final_price or 0
        payment.transaction_id = txn_id
        payment.customer_note  = note
        payment.status         = Payment.PayStatus.PENDING
        payment.calculate_amounts()

        if screenshot:
            payment.payment_screenshot = screenshot

        payment.save()

        # Update booking payment status to pending
        booking.payment_status = 'pending'
        booking.save(update_fields=['payment_status'])

        return Response({
            'message':    'Payment proof submitted. Admin will verify within 30 minutes.',
            'payment_id': payment.id,
            'status':     'pending',
            'amount':     payment.amount,
        }, status=201)


class CustomerPaymentHistoryView(ListAPIView):
    """GET /api/v1/payments/history/ — customer's payment history"""
    serializer_class = PaymentSerializer
    pagination_class = None

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user).select_related(
            'booking__service', 'booking__worker__user'
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


# ─── Admin: Payment management ────────────────────────────────────────────────

class AdminPaymentListView(ListAPIView):
    """GET /api/v1/payments/admin/ — all payments with filters"""
    permission_classes = [permissions.IsAdminUser]
    serializer_class   = PaymentSerializer
    pagination_class   = None

    def get_queryset(self):
        qs = Payment.objects.filter(
            payment_type=Payment.Type.BOOKING
        ).select_related(
            'booking__service', 'booking__worker__user',
            'user', 'verified_by'
        ).order_by('-created_at')

        status = self.request.query_params.get('status')
        method = self.request.query_params.get('method')
        if status: qs = qs.filter(status=status)
        if method: qs = qs.filter(method=method)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class AdminVerifyPaymentView(APIView):
    """
    PATCH /api/v1/payments/admin/<id>/verify/
    { "action": "verify" | "reject", "note": "optional reason" }
    """
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        try:
            payment = Payment.objects.select_related('booking').get(pk=pk)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found.'}, status=404)

        action = request.data.get('action')
        note   = request.data.get('note', '').strip()

        if action == 'verify':
            payment.status       = Payment.PayStatus.VERIFIED
            payment.verified_by  = request.user
            payment.verified_at  = timezone.now()
            payment.admin_note   = note
            payment.save()

            # Mark booking as paid
            if payment.booking:
                payment.booking.payment_status = 'paid'
                payment.booking.save(update_fields=['payment_status'])

            return Response({
                'message': 'Payment verified. Booking marked as paid.',
                'status':  'verified',
            })

        elif action == 'reject':
            if not note:
                return Response({'error': 'Rejection reason is required.'}, status=400)
            payment.status           = Payment.PayStatus.REJECTED
            payment.rejection_reason = note
            payment.verified_by      = request.user
            payment.verified_at      = timezone.now()
            payment.save()

            # Reset booking payment status
            if payment.booking:
                payment.booking.payment_status = 'unpaid'
                payment.booking.save(update_fields=['payment_status'])

            return Response({
                'message': 'Payment rejected.',
                'status':  'rejected',
                'reason':  note,
            })

        return Response({'error': 'action must be verify or reject.'}, status=400)


class AdminMarkWorkerPaidView(APIView):
    """PATCH /api/v1/payments/admin/<id>/mark-worker-paid/"""
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        payment.worker_paid      = True
        payment.worker_paid_at   = timezone.now()
        payment.worker_paid_note = request.data.get('note', '')
        payment.save(update_fields=['worker_paid', 'worker_paid_at', 'worker_paid_note'])

        return Response({'message': 'Worker payout recorded.'})


class AdminPaymentStatsView(APIView):
    """GET /api/v1/payments/admin/stats/"""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from django.db.models import Sum, Count

        all_payments = Payment.objects.filter(payment_type=Payment.Type.BOOKING)
        verified     = all_payments.filter(status__in=['verified', 'paid'])
        pending      = all_payments.filter(status='pending')
        rejected     = all_payments.filter(status='rejected')

        stats = {
            'total_revenue':        verified.aggregate(s=Sum('amount'))['s'] or 0,
            'total_commission':     verified.aggregate(s=Sum('commission_amount'))['s'] or 0,
            'total_worker_payouts': verified.aggregate(s=Sum('worker_amount'))['s'] or 0,

            'pending_count':  pending.count(),
            'verified_count': verified.count(),
            'rejected_count': rejected.count(),
            'total_count':    all_payments.count(),

            'pending_amount': pending.aggregate(s=Sum('amount'))['s'] or 0,

            'unpaid_worker_count': verified.filter(worker_paid=False).count(),

            # By method
            'upi_count':  verified.filter(method='upi_qr').count(),
            'bank_count': verified.filter(method='bank').count(),
            'cash_count': verified.filter(method='cash').count(),

            'upi_revenue':  verified.filter(method='upi_qr').aggregate(s=Sum('amount'))['s'] or 0,
            'bank_revenue': verified.filter(method='bank').aggregate(s=Sum('amount'))['s'] or 0,
            'cash_revenue': verified.filter(method='cash').aggregate(s=Sum('amount'))['s'] or 0,
        }
        return Response(stats)


class AdminPaymentConfigView(APIView):
    """GET/PATCH /api/v1/payments/admin/config/ — manage platform payment details"""
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        config = PlatformPaymentConfig.get_config()
        serializer = PaymentConfigSerializer(config, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        config = PlatformPaymentConfig.get_config()
        fields = [
            'upi_id', 'upi_name', 'bank_name', 'account_holder_name',
            'account_number', 'ifsc_code', 'branch_name', 'payment_instructions',
        ]
        for field in fields:
            if field in request.data:
                setattr(config, field, request.data[field])
        if 'upi_qr_image' in request.FILES:
            config.upi_qr_image = request.FILES['upi_qr_image']
        config.save()
        serializer = PaymentConfigSerializer(config, context={'request': request})
        return Response({'message': 'Payment config updated.', 'config': serializer.data})
