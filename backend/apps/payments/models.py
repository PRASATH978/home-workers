from django.db import models
from django.conf import settings


class Payment(models.Model):
    class Type(models.TextChoices):
        BOOKING = 'booking', 'Booking Payment'
        SUBSCRIPTION = 'subscription', 'Subscription'

    class PaymentMethod(models.TextChoices):
        RAZORPAY = 'razorpay', 'Razorpay'
        CASH = 'cash', 'Cash'

    class PayStatus(models.TextChoices):
        CREATED = 'created', 'Created'
        PAID = 'paid', 'Paid'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    booking = models.OneToOneField(
        'bookings.Booking', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='payment'
    )
    payment_type = models.CharField(max_length=20, choices=Type.choices, default=Type.BOOKING)
    method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.RAZORPAY)
    status = models.CharField(max_length=20, choices=PayStatus.choices, default=PayStatus.CREATED)
    amount = models.PositiveIntegerField(help_text='Amount in paise (multiply ₹ by 100)')

    # Razorpay IDs
    razorpay_order_id = models.CharField(max_length=100, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature = models.CharField(max_length=200, blank=True)

    # Subscription
    subscription_plan = models.CharField(max_length=20, blank=True)
    subscription_months = models.PositiveSmallIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment ₹{self.amount//100} - {self.status}"
