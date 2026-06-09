"""
python manage.py seed_bookings

Creates 40 realistic bookings:
  - 8 pending (waiting for worker)
  - 6 accepted (worker assigned)
  - 4 in_progress (job started)
  - 16 completed (with payments + reviews)
  - 4 cancelled
  - 2 rejected
"""
import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from apps.accounts.models import User
from apps.bookings.models import Booking, BookingReview
from apps.workers.models import WorkerProfile
from apps.services.models import ServiceCategory


PROBLEMS = {
    'plumber': [
        'Bathroom tap is leaking continuously, water dripping since yesterday.',
        'Kitchen sink blocked, water not draining at all.',
        'Toilet flush not working properly, handle broken.',
        'Water pipe burst near the bathroom wall, urgent repair needed.',
        'Overhead tank overflow pipe leaking, water wasting.',
    ],
    'electrician': [
        'Main switchboard MCB tripping frequently, needs inspection.',
        'Ceiling fan not working, making noise when switched on.',
        'Power socket in bedroom not working, needs replacement.',
        'New AC installation required, 1.5 ton split AC.',
        'All lights in hall suddenly stopped working.',
    ],
    'carpenter': [
        'Bedroom door hinge broken, door not closing properly.',
        'Kitchen cabinet drawer broken, needs repair.',
        'Wooden window frame swollen due to rain, not closing.',
        'Need a new bookshelf built — 4 shelves, wall mounted.',
        'Sofa wooden leg broken, needs replacement.',
    ],
    'painter': [
        'Full house interior painting required, 2BHK flat.',
        'Kitchen walls have damp patches, needs waterproofing + paint.',
        'Bedroom wall has peeling paint, needs scraping and repaint.',
        'New home exterior painting — need quotation.',
        'Single room painting, light blue color.',
    ],
    'ac-technician': [
        'AC not cooling properly, just blowing hot air.',
        'AC making loud noise when compressor starts.',
        'AC gas refill needed, cooling reduced.',
        'New 1.5 ton split AC installation at home.',
        'AC water leaking inside the room from indoor unit.',
    ],
    'ro-water': [
        'RO water purifier not giving water, motor running but no output.',
        'RO water tastes bad, filter replacement required.',
        'New Kent RO installation in kitchen.',
        'Aquaguard not working after power cut.',
        'RO making noise, need servicing.',
    ],
    'house-cleaning': [
        'Full deep cleaning of 2BHK flat required.',
        'Move-in cleaning needed, flat has not been cleaned for months.',
        'Bathroom deep cleaning — 2 bathrooms.',
        'Kitchen deep cleaning, heavy grease on walls and chimney.',
        'Post-construction cleaning, dust everywhere.',
    ],
    'driver': [
        'Need driver for Bangalore airport drop tomorrow 4am.',
        'Outstation trip — Krishnagiri to Chennai, one way.',
        'Office cab needed daily for 1 month.',
        'Wedding function driver needed for 2 days.',
        'Hospital visit, need driver for 4 hours.',
    ],
    'mason': [
        'Compound wall crack repair, about 10 feet length.',
        'Bathroom floor tile re-laying, tiles lifting.',
        'Small room construction for storage, 8x10 feet.',
        'Staircase parapet wall cracked, needs repair.',
        'Terrace waterproofing required, leaking to top floor.',
    ],
    'welder': [
        'Main gate welding required, hinge broken.',
        'Window grill fabrication and fitting, 3 windows.',
        'Steel door frame needs welding repair.',
        'Staircase railing loose, needs welding.',
        'New compound gate fabrication and fitting.',
    ],
    'gardener': [
        'Garden trimming needed, overgrown for 3 months.',
        'Lawn mowing and edging required.',
        'Dead plants removal and replanting.',
        'Terrace garden setup with pots and plants.',
        'Tree branch cutting — 2 large trees.',
    ],
}

ADDRESSES = [
    'No. 12, Gandhi Nagar, Krishnagiri – 635001',
    '45/2, Anna Salai, Hosur – 635109',
    'Door No. 8, KVS Nagar, Krishnagiri – 635001',
    'Plot 23, SIPCOT Colony, Hosur – 635126',
    '7, Nehru Street, Dharmapuri – 636701',
    'No. 56, Kaveri Nagar, Krishnagiri – 635002',
    'Flat 3B, Sri Sai Apartments, Hosur – 635109',
    '101, Bharathi Street, Dharmapuri – 636702',
    'No. 34, Vinayagar Kovil Street, Krishnagiri – 635001',
    'H.No 67, JP Nagar, Hosur – 635109',
]

CANCEL_REASONS = [
    'Problem resolved on my own',
    'Found another worker',
    'Postponed to next week',
    'Budget issue',
    'Worker did not respond',
]


class Command(BaseCommand):
    help = 'Seed 40 demo bookings with reviews'

    def handle(self, *args, **options):
        self.stdout.write('📅 Seeding bookings...')

        customers = list(User.objects.filter(role=User.Role.CUSTOMER))
        workers = list(WorkerProfile.objects.filter(verification_status='verified').select_related('user'))
        services = {s.slug: s for s in ServiceCategory.objects.all()}

        if not customers:
            self.stdout.write(self.style.ERROR('  ❌ No customers found. Run seed_users first.'))
            return
        if not workers:
            self.stdout.write(self.style.ERROR('  ❌ No workers found. Run seed_users first.'))
            return
        if not services:
            self.stdout.write(self.style.ERROR('  ❌ No services found. Run seed_services first.'))
            return

        def get_worker_for_service(slug):
            matching = [w for w in workers if w.services.filter(slug=slug).exists()]
            return random.choice(matching) if matching else random.choice(workers)

        def make_booking(customer, service_slug, status, days_ago, price=None):
            service = services.get(service_slug)
            if not service:
                return None
            problems = PROBLEMS.get(service_slug, ['General service required.'])
            created_at = timezone.now() - timedelta(days=days_ago, hours=random.randint(0, 12))

            booking = Booking(
                customer=customer,
                service=service,
                problem_description=random.choice(problems),
                address=random.choice(ADDRESSES),
                latitude=round(12.5 + random.uniform(-0.2, 0.3), 6),
                longitude=round(78.2 + random.uniform(-0.2, 0.3), 6),
                status=status,
                created_at=created_at,
            )

            if status in ['accepted', 'in_progress', 'completed', 'rejected']:
                worker = get_worker_for_service(service_slug)
                booking.worker = worker
                booking.accepted_at = created_at + timedelta(minutes=random.randint(10, 60))

            if status in ['in_progress', 'completed']:
                booking.started_at = booking.accepted_at + timedelta(minutes=random.randint(30, 120))

            if status == 'completed':
                booking.completed_at = booking.started_at + timedelta(hours=random.randint(1, 4))
                booking.final_price = price or random.choice([300, 400, 500, 600, 700, 800, 1000, 1200, 1500, 2000])
                booking.commission_amount = int(booking.final_price * 0.10)
                booking.payment_status = random.choice(['paid', 'paid', 'paid', 'unpaid'])

            if status == 'cancelled':
                booking.cancelled_at = created_at + timedelta(hours=random.randint(1, 6))
                booking.cancel_reason = random.choice(CANCEL_REASONS)

            if status == 'rejected':
                booking.cancel_reason = 'Worker not available in this area'

            return booking

        bookings_to_create = []

        # ── Pending (8) ────────────────────────────────────────────────────
        slugs = list(services.keys())
        for i in range(8):
            b = make_booking(random.choice(customers), random.choice(slugs), 'pending', random.randint(0, 2))
            if b: bookings_to_create.append(b)

        # ── Accepted (6) ──────────────────────────────────────────────────
        for i in range(6):
            b = make_booking(random.choice(customers), random.choice(slugs), 'accepted', random.randint(1, 3))
            if b: bookings_to_create.append(b)

        # ── In Progress (4) ───────────────────────────────────────────────
        for i in range(4):
            b = make_booking(random.choice(customers), random.choice(slugs), 'in_progress', random.randint(0, 1))
            if b: bookings_to_create.append(b)

        # ── Completed (16) ────────────────────────────────────────────────
        completed_data = [
            ('plumber',       500,  random.randint(5, 30)),
            ('electrician',   400,  random.randint(5, 30)),
            ('carpenter',     800,  random.randint(5, 30)),
            ('painter',       1500, random.randint(5, 30)),
            ('ac-technician', 700,  random.randint(5, 30)),
            ('ro-water',      350,  random.randint(5, 30)),
            ('house-cleaning',600,  random.randint(5, 30)),
            ('driver',        500,  random.randint(5, 30)),
            ('mason',         1000, random.randint(5, 30)),
            ('welder',        800,  random.randint(5, 30)),
            ('gardener',      400,  random.randint(5, 30)),
            ('plumber',       600,  random.randint(10, 60)),
            ('electrician',   300,  random.randint(10, 60)),
            ('carpenter',     1200, random.randint(10, 60)),
            ('ac-technician', 500,  random.randint(10, 60)),
            ('painter',       2000, random.randint(10, 60)),
        ]
        for slug, price, days in completed_data:
            b = make_booking(random.choice(customers), slug, 'completed', days, price)
            if b: bookings_to_create.append(b)

        # ── Cancelled (4) ─────────────────────────────────────────────────
        for i in range(4):
            b = make_booking(random.choice(customers), random.choice(slugs), 'cancelled', random.randint(3, 20))
            if b: bookings_to_create.append(b)

        # ── Rejected (2) ──────────────────────────────────────────────────
        for i in range(2):
            b = make_booking(random.choice(customers), random.choice(slugs), 'rejected', random.randint(5, 15))
            if b: bookings_to_create.append(b)

        # Save all bookings (bypass auto_now for created_at)
        created_count = 0
        reviews_count = 0
        for booking in bookings_to_create:
            booking.save()
            created_count += 1

            # Add review for completed bookings (80% chance)
            if booking.status == 'completed' and booking.worker and random.random() > 0.2:
                rating = random.choices([3, 4, 4, 5, 5, 5], k=1)[0]
                comments = {
                    5: ['Excellent work! Very professional and on time.', 'Great service, highly recommended!', 'Very satisfied with the work. Will call again.', 'Perfect job done quickly. Thank you!'],
                    4: ['Good work, came on time.', 'Satisfied with the service.', 'Nice work, reasonable price.', 'Good professional.'],
                    3: ['Work was okay, took more time than expected.', 'Average service.', 'Got the job done but could be better.'],
                }
                review = BookingReview(
                    booking=booking,
                    customer=booking.customer,
                    worker=booking.worker,
                    rating=rating,
                    comment=random.choice(comments[rating]),
                    created_at=booking.completed_at + timedelta(hours=random.randint(1, 48)),
                )
                review.save()
                # Update worker rating directly without double-counting
                reviews_count += 1

        self.stdout.write(f'  ✅ {created_count} bookings created')
        self.stdout.write(f'  ✅ {reviews_count} reviews created')
        self.stdout.write(self.style.SUCCESS('  ✅ Bookings seeded successfully'))
