from django.db import models
from django.conf import settings


class PlatformPaymentConfig(models.Model):
    """
    Admin-configurable payment details shown to customers.
    Only one row exists — use get_config() to fetch it.
    """
    # UPI
    upi_id          = models.CharField(max_length=100, default='localservice@upi')
    upi_name        = models.CharField(max_length=100, default='LocalService Connect')
    upi_qr_image    = models.ImageField(upload_to='payment_config/', blank=True, null=True,
                                         help_text='Upload your UPI QR code image')

    # Bank account
    bank_name           = models.CharField(max_length=100, blank=True, default='State Bank of India')
    account_holder_name = models.CharField(max_length=100, blank=True)
    account_number      = models.CharField(max_length=30, blank=True)
    ifsc_code           = models.CharField(max_length=20, blank=True)
    branch_name         = models.CharField(max_length=100, blank=True)

    # Display settings
    payment_instructions = models.TextField(
        default=(
            '1. Scan QR code or use UPI ID to pay\n'
            '2. Enter the exact amount shown\n'
            '3. Take a screenshot of the payment confirmation\n'
            '4. Upload screenshot and enter Transaction ID below\n'
            '5. Admin will verify within 30 minutes'
        )
    )
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'platform_payment_config'
        verbose_name = 'Payment Configuration'

    def __str__(self):
        return f"Payment Config — UPI: {self.upi_id}"

    @classmethod
    def get_config(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Payment(models.Model):

    class Type(models.TextChoices):
        BOOKING      = 'booking',      'Booking Payment'
        SUBSCRIPTION = 'subscription', 'Subscription'

    class PaymentMethod(models.TextChoices):
        UPI_QR   = 'upi_qr',   'UPI / QR Code'
        BANK     = 'bank',     'Bank Transfer'
        CASH     = 'cash',     'Cash'
        RAZORPAY = 'razorpay', 'Razorpay'

    class PayStatus(models.TextChoices):
        PENDING    = 'pending',    'Pending Verification'
        VERIFIED   = 'verified',   'Verified'
        REJECTED   = 'rejected',   'Rejected'
        PAID       = 'paid',       'Paid'      # alias for verified + booking updated
        REFUNDED   = 'refunded',   'Refunded'

    # Relations
    user    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    booking = models.OneToOneField(
        'bookings.Booking', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='payment'
    )

    payment_type = models.CharField(max_length=20, choices=Type.choices,          default=Type.BOOKING)
    method       = models.CharField(max_length=20, choices=PaymentMethod.choices,  default=PaymentMethod.UPI_QR)
    status       = models.CharField(max_length=20, choices=PayStatus.choices,      default=PayStatus.PENDING)

    # Amounts (in ₹)
    amount            = models.PositiveIntegerField(default=0)
    commission_amount = models.PositiveIntegerField(default=0)
    worker_amount     = models.PositiveIntegerField(default=0)

    # Customer-submitted proof
    transaction_id     = models.CharField(max_length=100, blank=True,
                                          help_text='UTR / Transaction reference ID')
    payment_screenshot = models.ImageField(upload_to='payment_proofs/', blank=True, null=True,
                                           help_text='Screenshot uploaded by customer')
    customer_note      = models.TextField(blank=True, help_text='Optional note from customer')

    # Admin verification
    verified_by        = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='verified_payments'
    )
    verified_at        = models.DateTimeField(null=True, blank=True)
    rejection_reason   = models.TextField(blank=True)
    admin_note         = models.TextField(blank=True)

    # Worker payout tracking
    worker_paid        = models.BooleanField(default=False)
    worker_paid_at     = models.DateTimeField(null=True, blank=True)
    worker_paid_note   = models.TextField(blank=True)

    # Razorpay (for card payments)
    razorpay_order_id   = models.CharField(max_length=100, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature  = models.CharField(max_length=200, blank=True)

    # Subscription fields
    subscription_plan   = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment #{self.id} ₹{self.amount} ({self.method}) — {self.status}"

    def calculate_amounts(self):
        pct = getattr(settings, 'RAZORPAY_COMMISSION_PERCENT', 10)
        self.commission_amount = int(self.amount * pct / 100)
        self.worker_amount     = self.amount - self.commission_amount
