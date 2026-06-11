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

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='customer_bookings'
    )
    worker = models.ForeignKey(
        'workers.WorkerProfile', on_delete=models.CASCADE,
        related_name='worker_bookings', null=True, blank=True
    )
    service = models.ForeignKey('services.ServiceCategory', on_delete=models.PROTECT)

    problem_description = models.TextField()
    address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    photos = models.JSONField(default=list, blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID
    )

    quoted_price = models.PositiveIntegerField(null=True, blank=True)
    final_price = models.PositiveIntegerField(null=True, blank=True)
    commission_amount = models.PositiveIntegerField(null=True, blank=True)

    # Use default=timezone.now (not auto_now_add) so seeds can set custom dates
    created_at = models.DateTimeField(default=timezone.now)
    accepted_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancel_reason = models.TextField(blank=True)
    completion_otp = models.CharField(max_length=6, blank=True)

    class Meta:
        db_table = 'bookings'
        ordering = ['-created_at']

    def __str__(self):
        return f"Booking #{self.id} — {self.service.name} ({self.status})"

    def calculate_commission(self):
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
        choices=[(i, str(i)) for i in range(1, 6)]
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'booking_reviews'

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        # Only update worker rating on first save, not updates
        if is_new:
            self.worker.update_rating(self.rating)

    def __str__(self):
        return f"Review for Booking #{self.booking_id}: {self.rating}★"
