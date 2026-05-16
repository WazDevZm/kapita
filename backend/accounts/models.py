from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model for Kapita"""
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    business_name = models.CharField(max_length=255, blank=True, null=True)
    currency = models.CharField(max_length=10, default='ZMW')
    theme = models.CharField(
        max_length=10,
        choices=[('light', 'Light'), ('dark', 'Dark')],
        default='light'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return self.email
