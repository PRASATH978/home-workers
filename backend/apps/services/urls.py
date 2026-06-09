from django.urls import path
from . import views

urlpatterns = [
    path('', views.ServiceCategoryListView.as_view(), name='service-list'),
    path('<slug:slug>/', views.ServiceCategoryDetailView.as_view(), name='service-detail'),
]
