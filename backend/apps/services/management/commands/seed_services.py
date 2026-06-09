from django.core.management.base import BaseCommand
from apps.services.models import ServiceCategory

SERVICES = [
    {
        'name': 'Plumber', 'slug': 'plumber', 'icon': 'wrench',
        'base_price': 300, 'sort_order': 1,
        'description': 'Fix leaks, pipe repairs, bathroom fittings, drainage issues, overhead tank problems',
    },
    {
        'name': 'Electrician', 'slug': 'electrician', 'icon': 'bolt',
        'base_price': 250, 'sort_order': 2,
        'description': 'Wiring, fan/light fitting, switchboard repair, MCB issues, new connections',
    },
    {
        'name': 'Carpenter', 'slug': 'carpenter', 'icon': 'hammer',
        'base_price': 400, 'sort_order': 3,
        'description': 'Furniture repair, door/window fitting, custom woodwork, wardrobes, shelves',
    },
    {
        'name': 'Painter', 'slug': 'painter', 'icon': 'paint',
        'base_price': 500, 'sort_order': 4,
        'description': 'Interior/exterior painting, waterproofing, texture work, whitewash',
    },
    {
        'name': 'AC Technician', 'slug': 'ac-technician', 'icon': 'snowflake',
        'base_price': 400, 'sort_order': 5,
        'description': 'AC service, gas refill, installation, repair, all brands',
    },
    {
        'name': 'RO Water Service', 'slug': 'ro-water', 'icon': 'droplet',
        'base_price': 300, 'sort_order': 6,
        'description': 'RO filter change, water purifier repair, installation, Kent/Aquaguard',
    },
    {
        'name': 'House Cleaning', 'slug': 'house-cleaning', 'icon': 'broom',
        'base_price': 500, 'sort_order': 7,
        'description': 'Deep cleaning, bathroom/kitchen cleaning, move-in/move-out cleaning',
    },
    {
        'name': 'Driver', 'slug': 'driver', 'icon': 'car',
        'base_price': 400, 'sort_order': 8,
        'description': 'Personal driver, outstation trips, airport pickup, hourly/daily hire',
    },
    {
        'name': 'Mason', 'slug': 'mason', 'icon': 'brick',
        'base_price': 600, 'sort_order': 9,
        'description': 'Brick laying, cement work, tile fixing, small construction, waterproofing',
    },
    {
        'name': 'Welder', 'slug': 'welder', 'icon': 'fire',
        'base_price': 500, 'sort_order': 10,
        'description': 'Metal fabrication, gate/grill welding, repair work, TIG/MIG welding',
    },
    {
        'name': 'Gardener', 'slug': 'gardener', 'icon': 'leaf',
        'base_price': 300, 'sort_order': 11,
        'description': 'Garden maintenance, trimming, landscaping, plant care, lawn mowing',
    },
]


class Command(BaseCommand):
    help = 'Seed 11 service categories'

    def handle(self, *args, **options):
        self.stdout.write('🔧 Seeding services...')
        created = 0
        for svc in SERVICES:
            obj, is_new = ServiceCategory.objects.update_or_create(
                slug=svc['slug'], defaults=svc
            )
            if is_new:
                created += 1
        self.stdout.write(self.style.SUCCESS(
            f'  ✅ {created} new services created ({len(SERVICES)} total)'
        ))
