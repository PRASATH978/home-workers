from django.db import models
from django.conf import settings
from django.utils import timezone


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        REJECTED = 'rejected', 'Rejected'

    class PaymentStatus(models.TextChoices):
        UNPAID = 'unpaid', 'Unpaid'
        PAID = 'paid', 'Paid'
        REFUNDED = 'refunded', 'Refunded'

    # Parties
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='customer_bookings'
    )
    worker = models.ForeignKey(
        'workers.WorkerProfile', on_delete=models.CASCADE,
        related_name='worker_bookings', null=True, blank=True
    )
    service = models.ForeignKey('services.ServiceCategory', on_delete=models.PROTECT)

    # Request details
    problem_description = models.TextField()
    address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True, help_text='Preferred time')
    photos = models.JSONField(default=list, blank=True, help_text='List of Cloudinary URLs')

    # Status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)

    # Pricing
    quoted_price = models.PositiveIntegerField(null=True, blank=True, help_text='Price in ₹')
    final_price = models.PositiveIntegerField(null=True, blank=True)
    commission_amount = models.PositiveIntegerField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancel_reason = models.TextField(blank=True)

    # OTP for job completion verification
    completion_otp = models.CharField(max_length=6, blank=True)

    class Meta:
        db_table = 'bookings'
        ordering = ['-created_at']

    def __str__(self):
        return f"Booking #{self.id} - {self.service.name} ({self.status})"

    def calculate_commission(self):
        from django.conf import settings
        if self.final_price:
            pct = getattr(settings, 'RAZORPAY_COMMISSION_PERCENT', 10)
            self.commission_amount = int(self.final_price * pct / 100)

    def accept(self, worker):
        self.worker = worker
        self.status = self.Status.ACCEPTED
        self.accepted_at = timezone.now()
        self.save(update_fields=['worker', 'status', 'accepted_at'])

    def start(self):
        self.status = self.Status.IN_PROGRESS
        self.started_at = timezone.now()
        self.save(update_fields=['status', 'started_at'])

    def complete(self, final_price=None):
        if final_price:
            self.final_price = final_price
            self.calculate_commission()
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at', 'final_price', 'commission_amount'])
        # Update worker stats
        if self.worker:
            self.worker.total_jobs += 1
            self.worker.save(update_fields=['total_jobs'])

    def cancel(self, reason=''):
        self.status = self.Status.CANCELLED
        self.cancelled_at = timezone.now()
        self.cancel_reason = reason
        self.save(update_fields=['status', 'cancelled_at', 'cancel_reason'])


class BookingReview(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    worker = models.ForeignKey('workers.WorkerProfile', on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(
        choices=[(1,'1'), (2,'2'), (3,'3'), (4,'4'), (5,'5')]
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'booking_reviews'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.worker.update_rating(self.rating)

    def __str__(self):
        return f"Review for Booking #{self.booking_id}: {self.rating}★"
