import razorpay
import hmac
import hashlib
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes

from .models import Payment
from apps.bookings.models import Booking
from apps.workers.models import WorkerProfile


def get_razorpay_client():
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class CreateBookingPaymentView(APIView):
    """Create Razorpay order for a completed booking"""

    def post(self, request, booking_id):
        booking = Booking.objects.get(pk=booking_id, customer=request.user)
        if not booking.final_price:
            return Response({'error': 'Price not set yet.'}, status=400)

        client = get_razorpay_client()
        order_data = {
            'amount': booking.final_price * 100,  # paise
            'currency': 'INR',
            'notes': {
                'booking_id': str(booking.id),
                'service': booking.service.name,
            }
        }
        order = client.order.create(data=order_data)

        payment = Payment.objects.create(
            user=request.user,
            booking=booking,
            payment_type=Payment.Type.BOOKING,
            amount=booking.final_price * 100,
            razorpay_order_id=order['id'],
        )

        return Response({
            'order_id': order['id'],
            'amount': booking.final_price * 100,
            'currency': 'INR',
            'key': settings.RAZORPAY_KEY_ID,
            'payment_id': payment.id,
        })


class CreateSubscriptionPaymentView(APIView):
    """Worker subscribes to Pro or Featured plan"""
    PLAN_PRICES = {
        'pro': 19900,      # ₹199 in paise
        'featured': 49900, # ₹499 in paise
    }

    def post(self, request):
        plan = request.data.get('plan')
        if plan not in self.PLAN_PRICES:
            return Response({'error': 'Invalid plan.'}, status=400)

        client = get_razorpay_client()
        order = client.order.create(data={
            'amount': self.PLAN_PRICES[plan],
            'currency': 'INR',
            'notes': {'plan': plan, 'user_id': str(request.user.id)},
        })

        payment = Payment.objects.create(
            user=request.user,
            payment_type=Payment.Type.SUBSCRIPTION,
            amount=self.PLAN_PRICES[plan],
            razorpay_order_id=order['id'],
            subscription_plan=plan,
        )

        return Response({
            'order_id': order['id'],
            'amount': self.PLAN_PRICES[plan],
            'currency': 'INR',
            'key': settings.RAZORPAY_KEY_ID,
            'payment_id': payment.id,
        })


class VerifyPaymentView(APIView):
    """Verify Razorpay payment signature"""

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        payment_id = request.data.get('payment_id')

        try:
            payment = Payment.objects.get(pk=payment_id, user=request.user)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found.'}, status=404)

        # Verify signature
        msg = f"{razorpay_order_id}|{razorpay_payment_id}"
        expected = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            msg.encode(),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected, razorpay_signature):
            payment.status = Payment.PayStatus.FAILED
            payment.save()
            return Response({'error': 'Payment verification failed.'}, status=400)

        # Mark paid
        payment.razorpay_payment_id = razorpay_payment_id
        payment.razorpay_signature = razorpay_signature
        payment.status = Payment.PayStatus.PAID
        payment.save()

        # Post-payment actions
        if payment.payment_type == Payment.Type.BOOKING and payment.booking:
            booking = payment.booking
            booking.payment_status = 'paid'
            booking.save(update_fields=['payment_status'])

        elif payment.payment_type == Payment.Type.SUBSCRIPTION:
            profile, _ = WorkerProfile.objects.get_or_create(user=request.user)
            profile.subscription_plan = payment.subscription_plan
            profile.subscription_expires_at = timezone.now() + timedelta(days=30)
            profile.save(update_fields=['subscription_plan', 'subscription_expires_at'])

        return Response({'message': 'Payment verified successfully.', 'status': 'paid'})
