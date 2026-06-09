# LocalService Connect 🔧

A full-stack hyperlocal service marketplace connecting customers with nearby service professionals.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 5.0 + Django REST Framework |
| Frontend | React 19 + Vite + Tailwind CSS + Redux Toolkit |
| Mobile | React Native + Expo SDK 51 |
| Database | PostgreSQL 16 |
| Storage | Cloudinary |
| Payments | Razorpay |
| Notifications | Twilio (SMS + WhatsApp) |
| Auth | JWT (SimpleJWT) + Google OAuth |
| Maps | Google Maps API |
| Deploy | Docker + docker-compose |

## Services Supported
Plumber, Electrician, Carpenter, Painter, AC Technician, RO Water Service,
House Cleaning, Driver, Mason, Welder, Gardener

## Revenue Model
- **Commission**: 10% per completed job
- **Monthly Subscription**: ₹199/month (unlimited leads)
- **Featured Listing**: ₹499/month (top placement)

## Project Structure
```
localservice/
├── backend/          # Django REST API
├── frontend/         # React 19 Web App
├── mobile/           # React Native Expo App
├── docker/           # Docker configs
└── docs/             # API documentation
```

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements/local.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend
cd frontend
npm install
cp .env.example .env
npm run dev

# Mobile
cd mobile
npm install
npx expo start
```

## Environment Variables
See `.env.example` in each directory.
