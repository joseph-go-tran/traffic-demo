from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.models import Customer


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    """
    Custom token refresh serializer that returns additional token information
    """

    def validate(self, attrs):
        refresh = RefreshToken(attrs["refresh"])

        # Get user from token
        user_id = refresh.payload.get("user_id")
        if not user_id:
            raise serializers.ValidationError("Invalid refresh token")

        try:
            user = Customer.objects.get(id=user_id)
        except Customer.DoesNotExist:
            raise serializers.ValidationError("User not found")

        # Generate new access token
        access_token = refresh.access_token

        # Add custom claims to the new access token
        access_token["email"] = user.email
        access_token["first_name"] = user.first_name
        access_token["last_name"] = user.last_name
        access_token["username"] = user.username
        access_token["is_staff"] = user.is_staff
        access_token["user_id"] = user.id

        return {
            "access": str(access_token),
            "refresh": str(refresh),
            "token_type": "Bearer",
            "expires_in": access_token.payload["exp"]
            - access_token.payload["iat"],
            "refresh_expires_in": refresh.payload["exp"]
            - refresh.payload["iat"],
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_active": user.is_active,
                "is_staff": user.is_staff,
            },
        }
