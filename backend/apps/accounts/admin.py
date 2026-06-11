from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from allauth.account.models import EmailAddress
from allauth.socialaccount.models import SocialAccount, SocialApp, SocialToken
from django.contrib.sites.models import Site

# ── Unregister unnecessary models ────────────────────────────────────────────
for model in [Group, EmailAddress, SocialAccount, SocialApp, SocialToken, Site]:
    try:
        admin.site.unregister(model)
    except admin.sites.NotRegistered:
        pass

# ── Register User ─────────────────────────────────────────────────────────────
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['phone', 'name', 'role', 'city', 'is_phone_verified', 'is_staff']
    list_filter   = ['role', 'is_phone_verified', 'is_staff', 'is_active']
    search_fields = ['phone', 'name', 'email', 'city']
    ordering      = ['-id']
    readonly_fields = ['last_login']

    fieldsets = (
        ('Login',       {'fields': ('phone', 'password')}),
        ('Personal',    {'fields': ('name', 'email', 'city', 'latitude', 'longitude', 'profile_photo')}),
        ('Role',        {'fields': ('role', 'is_phone_verified')}),
        ('Permissions', {'fields': ('is_staff', 'is_superuser', 'is_active')}),
        ('Dates',       {'fields': ('last_login',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone', 'name', 'role', 'password1', 'password2'),
        }),
    )

# ── Also hide Periodic Tasks & Token Blacklist ────────────────────────────────
try:
    from django_celery_beat.models import (
        ClockedSchedule, CrontabSchedule, IntervalSchedule,
        PeriodicTask, SolarSchedule
    )
    for model in [ClockedSchedule, CrontabSchedule, IntervalSchedule, PeriodicTask, SolarSchedule]:
        try:
            admin.site.unregister(model)
        except admin.sites.NotRegistered:
            pass
except ImportError:
    pass

try:
    from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
    for model in [BlacklistedToken, OutstandingToken]:
        try:
            admin.site.unregister(model)
        except admin.sites.NotRegistered:
            pass
except ImportError:
    pass