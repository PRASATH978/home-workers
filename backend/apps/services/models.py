from django.db import models


class ServiceCategory(models.Model):
    """Master list of service types"""
    ICON_CHOICES = [
        ('wrench', '🔧 Plumber'),
        ('bolt', '⚡ Electrician'),
        ('hammer', '🔨 Carpenter'),
        ('paint', '🎨 Painter'),
        ('snowflake', '❄️ AC Technician'),
        ('droplet', '💧 RO Water Service'),
        ('broom', '🧹 House Cleaning'),
        ('car', '🚗 Driver'),
        ('brick', '🧱 Mason'),
        ('fire', '🔥 Welder'),
        ('leaf', '🌿 Gardener'),
    ]

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=20, choices=ICON_CHOICES, blank=True)
    description = models.TextField(blank=True)
    base_price = models.PositiveIntegerField(default=200, help_text='Minimum charge in ₹')
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    image = models.ImageField(upload_to='services/', blank=True, null=True)

    class Meta:
        db_table = 'service_categories'
        ordering = ['sort_order', 'name']
        verbose_name = 'Service Category'
        verbose_name_plural = 'Service Categories'

    def __str__(self):
        return self.name
