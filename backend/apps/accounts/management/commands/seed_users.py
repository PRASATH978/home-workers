"""
python manage.py seed_users

Creates:
  - 1 admin superuser
  - 10 customers
  - 15 workers with full profiles (verified + pending mix)
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

from apps.accounts.models import User
from apps.workers.models import WorkerProfile
from apps.services.models import ServiceCategory


# ─── Data ────────────────────────────────────────────────────────────────────

CUSTOMERS = [
    {'name': 'Ravi Kumar',      'phone': '9111111101', 'city': 'Krishnagiri', 'state': 'Tamil Nadu'},
    {'name': 'Priya Shankar',   'phone': '9111111102', 'city': 'Hosur',       'state': 'Tamil Nadu'},
    {'name': 'Murugan Raj',     'phone': '9111111103', 'city': 'Krishnagiri', 'state': 'Tamil Nadu'},
    {'name': 'Lakshmi Devi',    'phone': '9111111104', 'city': 'Dharmapuri',  'state': 'Tamil Nadu'},
    {'name': 'Senthil Kumar',   'phone': '9111111105', 'city': 'Hosur',       'state': 'Tamil Nadu'},
    {'name': 'Kavitha Raj',     'phone': '9111111106', 'city': 'Bangalore',   'state': 'Karnataka'},
    {'name': 'Arjun Prasad',    'phone': '9111111107', 'city': 'Krishnagiri', 'state': 'Tamil Nadu'},
    {'name': 'Meena Kumari',    'phone': '9111111108', 'city': 'Hosur',       'state': 'Tamil Nadu'},
    {'name': 'Deepak Nair',     'phone': '9111111109', 'city': 'Dharmapuri',  'state': 'Tamil Nadu'},
    {'name': 'Anitha Selvam',   'phone': '9111111110', 'city': 'Krishnagiri', 'state': 'Tamil Nadu'},
]

WORKERS = [
    {
        'name': 'Suresh Plumber',     'phone': '9222222201',
        'city': 'Krishnagiri',        'state': 'Tamil Nadu',
        'services': ['plumber'],
        'bio': '8 years experience in residential plumbing. Specialise in bathroom fittings, pipe repairs, and drainage.',
        'experience_years': 8, 'service_radius_km': 15,
        'verification_status': 'verified', 'total_jobs': 142,
        'rating_sum': 612.0, 'rating_count': 126,
        'subscription_plan': 'featured',
        'lat': 12.5266, 'lng': 78.2136,
    },
    {
        'name': 'Rajan Electrician',  'phone': '9222222202',
        'city': 'Krishnagiri',        'state': 'Tamil Nadu',
        'services': ['electrician'],
        'bio': 'Certified electrician. Handle all wiring, fan/AC fitting, MCB panel work.',
        'experience_years': 6, 'service_radius_km': 20,
        'verification_status': 'verified', 'total_jobs': 98,
        'rating_sum': 440.0, 'rating_count': 91,
        'subscription_plan': 'pro',
        'lat': 12.5310, 'lng': 78.2200,
    },
    {
        'name': 'Murugan Carpenter',  'phone': '9222222203',
        'city': 'Hosur',              'state': 'Tamil Nadu',
        'services': ['carpenter'],
        'bio': 'Custom furniture, door/window repairs, wardrobes. Quality work guaranteed.',
        'experience_years': 12, 'service_radius_km': 25,
        'verification_status': 'verified', 'total_jobs': 213,
        'rating_sum': 980.0, 'rating_count': 204,
        'subscription_plan': 'featured',
        'lat': 12.7409, 'lng': 77.8253,
    },
    {
        'name': 'Venkat Painter',     'phone': '9222222204',
        'city': 'Krishnagiri',        'state': 'Tamil Nadu',
        'services': ['painter'],
        'bio': 'Interior & exterior painting. Asian Paints dealer. Texture work available.',
        'experience_years': 9, 'service_radius_km': 20,
        'verification_status': 'verified', 'total_jobs': 87,
        'rating_sum': 390.0, 'rating_count': 82,
        'subscription_plan': 'basic',
        'lat': 12.5280, 'lng': 78.2150,
    },
    {
        'name': 'Karthik AC Tech',    'phone': '9222222205',
        'city': 'Hosur',              'state': 'Tamil Nadu',
        'services': ['ac-technician'],
        'bio': 'All AC brands. Service, gas refill, installation. Same day service.',
        'experience_years': 5, 'service_radius_km': 30,
        'verification_status': 'verified', 'total_jobs': 176,
        'rating_sum': 792.0, 'rating_count': 169,
        'subscription_plan': 'pro',
        'lat': 12.7350, 'lng': 77.8300,
    },
    {
        'name': 'Selvam RO Service',  'phone': '9222222206',
        'city': 'Dharmapuri',         'state': 'Tamil Nadu',
        'services': ['ro-water'],
        'bio': 'Kent, Aquaguard, Pureit expert. Filter replacement, motor repair.',
        'experience_years': 4, 'service_radius_km': 20,
        'verification_status': 'verified', 'total_jobs': 64,
        'rating_sum': 295.0, 'rating_count': 61,
        'subscription_plan': 'basic',
        'lat': 12.1269, 'lng': 78.1578,
    },
    {
        'name': 'Anbu Cleaning',      'phone': '9222222207',
        'city': 'Krishnagiri',        'state': 'Tamil Nadu',
        'services': ['house-cleaning'],
        'bio': 'Deep cleaning, move-in/move-out cleaning, bathroom & kitchen specialists.',
        'experience_years': 3, 'service_radius_km': 15,
        'verification_status': 'verified', 'total_jobs': 45,
        'rating_sum': 207.0, 'rating_count': 43,
        'subscription_plan': 'basic',
        'lat': 12.5240, 'lng': 78.2100,
    },
    {
        'name': 'Ramesh Driver',      'phone': '9222222208',
        'city': 'Hosur',              'state': 'Tamil Nadu',
        'services': ['driver'],
        'bio': '10 years driving experience. Outstation, city trips, airport pickup.',
        'experience_years': 10, 'service_radius_km': 50,
        'verification_status': 'verified', 'total_jobs': 312,
        'rating_sum': 1435.0, 'rating_count': 298,
        'subscription_plan': 'featured',
        'lat': 12.7450, 'lng': 77.8200,
    },
    {
        'name': 'Pandi Mason',        'phone': '9222222209',
        'city': 'Krishnagiri',        'state': 'Tamil Nadu',
        'services': ['mason'],
        'bio': 'Tile fixing, cement work, boundary walls, small construction work.',
        'experience_years': 15, 'service_radius_km': 20,
        'verification_status': 'verified', 'total_jobs': 78,
        'rating_sum': 340.0, 'rating_count': 71,
        'subscription_plan': 'basic',
        'lat': 12.5300, 'lng': 78.2180,
    },
    {
        'name': 'Kumar Welder',       'phone': '9222222210',
        'city': 'Dharmapuri',         'state': 'Tamil Nadu',
        'services': ['welder'],
        'bio': 'Gate fabrication, grill welding, metal repair. TIG/MIG welding expert.',
        'experience_years': 7, 'service_radius_km': 25,
        'verification_status': 'verified', 'total_jobs': 56,
        'rating_sum': 243.0, 'rating_count': 51,
        'subscription_plan': 'basic',
        'lat': 12.1300, 'lng': 78.1600,
    },
    {
        'name': 'Gopal Gardener',     'phone': '9222222211',
        'city': 'Hosur',              'state': 'Tamil Nadu',
        'services': ['gardener'],
        'bio': 'Garden maintenance, landscaping, plant care, lawn trimming.',
        'experience_years': 6, 'service_radius_km': 15,
        'verification_status': 'verified', 'total_jobs': 33,
        'rating_sum': 155.0, 'rating_count': 31,
        'subscription_plan': 'basic',
        'lat': 12.7380, 'lng': 77.8270,
    },
    # Multi-skill workers
    {
        'name': 'Arjun Multi Tech',   'phone': '9222222212',
        'city': 'Krishnagiri',        'state': 'Tamil Nadu',
        'services': ['plumber', 'electrician'],
        'bio': 'Plumbing and electrical work. One call for multiple repairs.',
        'experience_years': 10, 'service_radius_km': 20,
        'verification_status': 'verified', 'total_jobs': 189,
        'rating_sum': 851.0, 'rating_count': 180,
        'subscription_plan': 'pro',
        'lat': 12.5260, 'lng': 78.2140,
    },
    {
        'name': 'Balu Home Services', 'phone': '9222222213',
        'city': 'Hosur',              'state': 'Tamil Nadu',
        'services': ['house-cleaning', 'painter'],
        'bio': 'Complete home care — cleaning and painting services at best rates.',
        'experience_years': 4, 'service_radius_km': 20,
        'verification_status': 'verified', 'total_jobs': 52,
        'rating_sum': 228.0, 'rating_count': 47,
        'subscription_plan': 'basic',
        'lat': 12.7420, 'lng': 77.8240,
    },
    # Pending verification workers
    {
        'name': 'Vijay New Plumber',  'phone': '9222222214',
        'city': 'Krishnagiri',        'state': 'Tamil Nadu',
        'services': ['plumber'],
        'bio': 'New to the platform. 3 years experience.',
        'experience_years': 3, 'service_radius_km': 10,
        'verification_status': 'pending', 'total_jobs': 0,
        'rating_sum': 0, 'rating_count': 0,
        'subscription_plan': 'basic',
        'lat': 12.5290, 'lng': 78.2160,
    },
    {
        'name': 'Sundar Electrician', 'phone': '9222222215',
        'city': 'Dharmapuri',         'state': 'Tamil Nadu',
        'services': ['electrician', 'ac-technician'],
        'bio': 'Electrical and AC work. Reasonable rates.',
        'experience_years': 2, 'service_radius_km': 15,
        'verification_status': 'pending', 'total_jobs': 0,
        'rating_sum': 0, 'rating_count': 0,
        'subscription_plan': 'basic',
        'lat': 12.1280, 'lng': 78.1590,
    },
]


class Command(BaseCommand):
    help = 'Seed admin, customers, and workers'

    def handle(self, *args, **options):
        self.stdout.write('👤 Seeding users...')

        # ── Admin ──────────────────────────────────────────────────────────
        admin, created = User.objects.get_or_create(
            phone='9000000000',
            defaults={
                'name': 'Admin User',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'is_phone_verified': True,
                'city': 'Krishnagiri',
                'state': 'Tamil Nadu',
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(f'  ✅ Admin created → {admin.phone}')
        else:
            self.stdout.write(f'  ⏭️  Admin already exists → {admin.phone}')

        # ── Customers ──────────────────────────────────────────────────────
        created_customers = 0
        for data in CUSTOMERS:
            user, created = User.objects.get_or_create(
                phone=data['phone'],
                defaults={
                    'name': data['name'],
                    'role': User.Role.CUSTOMER,
                    'is_phone_verified': True,
                    'city': data['city'],
                    'state': data['state'],
                    'latitude': round(12.5 + random.uniform(-0.2, 0.2), 6),
                    'longitude': round(78.2 + random.uniform(-0.2, 0.2), 6),
                }
            )
            if created:
                user.set_password('pass1234')
                user.save()
                created_customers += 1

        self.stdout.write(f'  ✅ {created_customers} customers created')

        # ── Workers ────────────────────────────────────────────────────────
        services_map = {s.slug: s for s in ServiceCategory.objects.all()}
        if not services_map:
            self.stdout.write(self.style.WARNING('  ⚠️  No services found. Run seed_services first.'))
            return

        created_workers = 0
        for data in WORKERS:
            user, u_created = User.objects.get_or_create(
                phone=data['phone'],
                defaults={
                    'name': data['name'],
                    'role': User.Role.WORKER,
                    'is_phone_verified': True,
                    'city': data['city'],
                    'state': data['state'],
                    'latitude': data['lat'],
                    'longitude': data['lng'],
                }
            )
            if u_created:
                user.set_password('pass1234')
                user.save()

            profile, p_created = WorkerProfile.objects.get_or_create(
                user=user,
                defaults={
                    'bio': data['bio'],
                    'experience_years': data['experience_years'],
                    'service_radius_km': data['service_radius_km'],
                    'verification_status': data['verification_status'],
                    'is_available': True,
                    'total_jobs': data['total_jobs'],
                    'rating_sum': data['rating_sum'],
                    'rating_count': data['rating_count'],
                    'subscription_plan': data['subscription_plan'],
                    'subscription_expires_at': (
                        timezone.now() + timedelta(days=30)
                        if data['subscription_plan'] != 'basic' else None
                    ),
                    'id_proof_type': 'aadhaar',
                    'available_from': '08:00',
                    'available_to': '20:00',
                }
            )

            # Assign services
            service_objs = [services_map[slug] for slug in data['services'] if slug in services_map]
            profile.services.set(service_objs)

            if p_created:
                created_workers += 1

        self.stdout.write(f'  ✅ {created_workers} workers created')
        self.stdout.write(self.style.SUCCESS('  ✅ Users seeded successfully'))
