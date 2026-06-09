from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import timedelta
import random

from .models import User, OTP
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    TokenSerializer, OTPRequestSerializer, OTPVerifySerializer,
    ChangePasswordSerializer,
)
from apps.notifications.services import NotificationService


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = TokenSerializer.get_tokens(user)
        return Response(tokens, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        tokens = TokenSerializer.get_tokens(user)
        return Response(tokens)


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'})
        except Exception:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class SendOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']

        otp_code = str(random.randint(100000, 999999))
        OTP.objects.filter(phone=phone, is_used=False).update(is_used=True)
        OTP.objects.create(
            phone=phone,
            otp=otp_code,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        NotificationService.send_sms(
            phone,
            f"Your LocalService OTP is {otp_code}. Valid for 10 minutes."
        )
        return Response({'message': 'OTP sent successfully.'})


class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']
        otp_code = serializer.validated_data['otp']

        otp_obj = OTP.objects.filter(phone=phone, otp=otp_code, is_used=False).last()
        if not otp_obj or not otp_obj.is_valid():
            return Response({'error': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj.is_used = True
        otp_obj.save()

        user, _ = User.objects.get_or_create(phone=phone, defaults={'name': phone, 'is_phone_verified': True})
        if not user.is_phone_verified:
            user.is_phone_verified = True
            user.save()

        tokens = TokenSerializer.get_tokens(user)
        return Response(tokens)


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Password changed successfully.'})


class UpdateLocationView(APIView):
    def post(self, request):
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        city = request.data.get('city', '')
        state = request.data.get('state', '')

        if not lat or not lng:
            return Response({'error': 'Latitude and longitude required.'}, status=400)

        request.user.latitude = lat
        request.user.longitude = lng
        request.user.city = city
        request.user.state = state
        request.user.save(update_fields=['latitude', 'longitude', 'city', 'state'])
        return Response({'message': 'Location updated.'})
