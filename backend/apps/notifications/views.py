from rest_framework.views import APIView
from rest_framework.response import Response
from django.urls import path


class NotificationsListView(APIView):
    def get(self, request):
        # Placeholder - in production use django-channels or Firebase FCM
        return Response({'notifications': [], 'unread_count': 0})


urlpatterns = [
    path('', NotificationsListView.as_view(), name='notifications'),
]
