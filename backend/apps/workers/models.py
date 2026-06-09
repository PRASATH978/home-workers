from django.db import models
from django.conf import settings
from django.utils import timezone


class WorkerProfile(models.Model):
    class VerificationStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        VERIFIED = 'verified', 'Verified'
        REJECTED = 'rejected', 'Rejected'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='worker_profile'
    )
    services = models.ManyToManyField('services.ServiceCategory', related_name='workers')
    bio = models.TextField(blank=True)
    experience_years = models.PositiveSmallIntegerField(default=0)

    # ID Verification
    id_proof_type = models.CharField(
        max_length=30,
        choices=[
            ('aadhaar', 'Aadhaar Card'),
            ('pan', 'PAN Card'),
            ('voter', 'Voter ID'),
            ('licence', 'Driving Licence'),
        ],
        blank=True
    )
    id_proof_image = models.ImageField(upload_to='id_proofs/', blank=True, null=True)
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING
    )
    verification_note = models.TextField(blank=True)

    # Availability
    is_available = models.BooleanField(default=True)
    available_from = models.TimeField(null=True, blank=True)
    available_to = models.TimeField(null=True, blank=True)

    # Service area
    service_radius_km = models.PositiveSmallIntegerField(default=10)

    # Stats
    total_jobs = models.PositiveIntegerField(default=0)
    rating_sum = models.FloatField(default=0.0)
    rating_count = models.PositiveIntegerField(default=0)

    # Subscription
    subscription_plan = models.CharField(
        max_length=20,
        choices=[
            ('basic', 'Basic (Free)'),
            ('pro', 'Pro ₹199/month'),
            ('featured', 'Featured ₹499/month'),
        ],
        default='basic'
    )
    subscription_expires_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'worker_profiles'

    def __str__(self):
        return f"Worker: {self.user.name}"

    @property
    def avg_rating(self):
        if self.rating_count == 0:
            return 0.0
        return round(self.rating_sum / self.rating_count, 1)

    @property
    def is_featured(self):
        return (
            self.subscription_plan == 'featured'
            and self.subscription_expires_at
            and self.subscription_expires_at > timezone.now()
        )

    @property
    def is_pro(self):
        return (
            self.subscription_plan in ['pro', 'featured']
            and self.subscription_expires_at
            and self.subscription_expires_at > timezone.now()
        )

    def update_rating(self, new_rating: float):
        self.rating_sum += new_rating
        self.rating_count += 1
        self.save(update_fields=['rating_sum', 'rating_count'])


class WorkerDocument(models.Model):
    worker = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=100)
    file = models.FileField(upload_to='worker_docs/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'worker_documents'


class WorkerAvailabilitySlot(models.Model):
    """Blocked dates/times when worker is unavailable"""
    DAYS = [
        (0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'),
        (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday'),
    ]
    worker = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE, related_name='availability_slots')
    day_of_week = models.PositiveSmallIntegerField(choices=DAYS)
    is_available = models.BooleanField(default=True)
    from_time = models.TimeField()
    to_time = models.TimeField()

    class Meta:
        db_table = 'worker_availability_slots'
        unique_together = ['worker', 'day_of_week']
