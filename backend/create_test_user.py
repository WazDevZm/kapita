#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kapita.settings')
django.setup()

from accounts.models import User

# Delete existing test users
User.objects.filter(username__in=['demo', 'testuser', 'test']).delete()

# Create a test user with properly hashed password
user = User.objects.create_user(
    username='demo',
    email='demo@test.com',
    password='demo123',
    first_name='Demo',
    last_name='User',
    business_name='Demo Business'
)

print(f"✅ Created user: {user.username}")
print(f"   Email: {user.email}")
print(f"   Password: demo123")
print(f"   Password hash: {user.password[:50]}...")
print(f"\n🔐 Password is properly hashed: {user.password.startswith('pbkdf2_sha256')}")
