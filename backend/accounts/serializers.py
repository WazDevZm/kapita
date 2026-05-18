from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from billing.utils import access_summary, trial_end_date, latest_active_subscription, latest_payment

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    access_status = serializers.SerializerMethodField()
    trial_end_date = serializers.SerializerMethodField()
    subscription_end_date = serializers.SerializerMethodField()
    expiry_date = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    is_trial_active = serializers.SerializerMethodField()
    is_subscription_active = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    is_pending_payment = serializers.SerializerMethodField()
    last_payment_date = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'business_name', 'currency', 'theme', 'is_staff', 'is_superuser',
            'date_joined', 'created_at', 'updated_at',
            'access_status', 'trial_end_date', 'subscription_end_date', 'expiry_date',
            'days_remaining', 'is_trial_active', 'is_subscription_active',
            'is_expired', 'is_pending_payment', 'last_payment_date'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_staff', 'is_superuser', 'date_joined']

    def get_access_status(self, obj):
        return access_summary(obj)['access_status']

    def get_trial_end_date(self, obj):
        return trial_end_date(obj)

    def get_subscription_end_date(self, obj):
        subscription = latest_active_subscription(obj)
        return subscription.end_date if subscription else None

    def get_expiry_date(self, obj):
        return access_summary(obj)['expiry_date']

    def get_days_remaining(self, obj):
        return access_summary(obj)['days_remaining']

    def get_is_trial_active(self, obj):
        return access_summary(obj)['is_trial_active']

    def get_is_subscription_active(self, obj):
        return access_summary(obj)['is_subscription_active']

    def get_is_expired(self, obj):
        return access_summary(obj)['is_expired']

    def get_is_pending_payment(self, obj):
        return access_summary(obj)['is_pending_payment']

    def get_last_payment_date(self, obj):
        last_payment = latest_payment(obj)
        return last_payment.reviewed_at if last_payment and last_payment.reviewed_at else None


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'phone', 'business_name'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        # Use the manager's `create_user` to ensure password is hashed
        # and any custom user creation logic runs.
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password]
    )


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for profile updates"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone',
            'business_name', 'currency', 'theme'
        ]
