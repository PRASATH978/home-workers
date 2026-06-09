from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class NotificationService:

    @staticmethod
    def _get_client():
        from twilio.rest import Client
        return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

    @classmethod
    def send_sms(cls, phone: str, message: str) -> bool:
        """Send SMS via Twilio"""
        if not settings.TWILIO_ACCOUNT_SID:
            logger.info(f"[SMS MOCK] To {phone}: {message}")
            return True
        try:
            # Normalize phone
            if not phone.startswith('+'):
                phone = f'+91{phone}'
            client = cls._get_client()
            client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone
            )
            logger.info(f"SMS sent to {phone}")
            return True
        except Exception as e:
            logger.error(f"SMS failed to {phone}: {e}")
            return False

    @classmethod
    def send_whatsapp(cls, phone: str, message: str) -> bool:
        """Send WhatsApp message via Twilio"""
        if not settings.TWILIO_ACCOUNT_SID:
            logger.info(f"[WHATSAPP MOCK] To {phone}: {message}")
            return True
        try:
            if not phone.startswith('+'):
                phone = f'+91{phone}'
            client = cls._get_client()
            client.messages.create(
                body=message,
                from_=settings.TWILIO_WHATSAPP_NUMBER,
                to=f'whatsapp:{phone}'
            )
            logger.info(f"WhatsApp sent to {phone}")
            return True
        except Exception as e:
            logger.error(f"WhatsApp failed to {phone}: {e}")
            return False

    @classmethod
    def notify_booking_created(cls, booking):
        cls.send_sms(
            booking.customer.phone,
            f"✅ Booking #{booking.id} created for {booking.service.name}. "
            f"We're finding a worker near you!"
        )

    @classmethod
    def notify_booking_accepted(cls, booking):
        cls.send_whatsapp(
            booking.customer.phone,
            f"🎉 {booking.worker.user.name} accepted your {booking.service.name} request!\n"
            f"📞 {booking.worker.user.phone}"
        )

    @classmethod
    def notify_booking_completed(cls, booking):
        cls.send_whatsapp(
            booking.customer.phone,
            f"✅ Job completed! Amount: ₹{booking.final_price}. "
            f"Please rate {booking.worker.user.name} in the app."
        )
