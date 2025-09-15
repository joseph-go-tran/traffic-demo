from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.models import Customer


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        required=False,
        allow_blank=True,
        validators=[],  # We'll handle validation in validate_username method
    )

    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=Customer.objects.all())],
    )

    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )

    class Meta:
        model = Customer
        fields = (
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "bio",
            "birth_date",
            "address",
        )

    def validate_username(self, value):
        """
        Validate username only if it's provided and not empty
        """
        if (
            value and value.strip()
        ):  # Only validate if username is provided and not just whitespace
            if Customer.objects.filter(username=value).exists():
                raise serializers.ValidationError(
                    "This username is already taken."
                )
        return value

    def create(self, validated_data):
        # If username is not provided or is empty, generate one from email
        if not validated_data.get("username"):
            email = validated_data["email"]
            base_username = email.split("@")[0]
            username = base_username

            # Ensure username is unique by appending numbers if needed
            counter = 1
            while Customer.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            validated_data["username"] = username

        user = Customer.objects.create(**validated_data)

        user.set_password(validated_data["password"])
        user.save()

        return user

    def to_representation(self, instance):
        """
        Override to return tokens and user data after registration
        """
        # Generate tokens for the newly created user
        refresh = RefreshToken.for_user(instance)
        access_token = refresh.access_token

        # Add custom claims to tokens
        refresh["email"] = instance.email
        refresh["first_name"] = instance.first_name
        refresh["last_name"] = instance.last_name
        refresh["username"] = instance.username
        refresh["is_staff"] = instance.is_staff
        refresh["user_id"] = instance.id

        access_token["email"] = instance.email
        access_token["first_name"] = instance.first_name
        access_token["last_name"] = instance.last_name
        access_token["username"] = instance.username
        access_token["is_staff"] = instance.is_staff
        access_token["user_id"] = instance.id

        return {
            "message": "User registered successfully",
            "refresh": str(refresh),
            "access": str(access_token),
            "token_type": "Bearer",
            "expires_in": access_token.payload["exp"]
            - access_token.payload["iat"],
            "refresh_expires_in": refresh.payload["exp"]
            - refresh.payload["iat"],
            "user": {
                "id": instance.id,
                "email": instance.email,
                "username": instance.username,
                "first_name": instance.first_name,
                "last_name": instance.last_name,
                "bio": instance.bio,
                "birth_date": instance.birth_date.isoformat()
                if instance.birth_date
                else None,
                "address": instance.address,
                "is_active": instance.is_active,
                "is_staff": instance.is_staff,
                "date_joined": instance.date_joined.isoformat(),
            },
        }
