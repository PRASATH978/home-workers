"""
python manage.py seed_all

Seeds the entire database with realistic demo data:
  - 1 admin user
  - 10 customers
  - 15 workers (all 11 service types covered)
  - 11 service categories
  - 40 bookings (various statuses)
  - Reviews for completed bookings
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Seed all demo data (services + users + workers + bookings)'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing data before seeding')

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('\n🌱 Seeding LocalService Connect demo data...\n'))

        if options['clear']:
            self.stdout.write('🗑️  Clearing existing data...')
            call_command('flush', '--no-input')

        call_command('seed_services')
        call_command('seed_users')
        call_command('seed_bookings')

        self.stdout.write(self.style.SUCCESS('\n✅ All seed data created successfully!\n'))
        self.stdout.write('📋 Login credentials:')
        self.stdout.write('   Admin    → phone: 9000000000  password: admin123')
        self.stdout.write('   Customer → phone: 9111111101  password: pass1234')
        self.stdout.write('   Worker   → phone: 9222222201  password: pass1234')
        self.stdout.write('\n🌐 Admin panel → http://localhost:5173/admin')
        self.stdout.write('🌐 Django admin → http://localhost:8000/admin\n')
