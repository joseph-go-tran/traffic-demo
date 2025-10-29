from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer that allows authentication with email and password
    instead of username and password.
    """

    username_field = "email"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove the username field and add email field
        self.fields.pop("username", None)
        self.fields["email"] = serializers.EmailField(required=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            # Use our custom authentication backend
            user = authenticate(
                request=self.context.get("request"),
                email=email,
                password=password,
            )

            if not user:
                raise serializers.ValidationError(
                    "Email or password incorrect.",
                    code="authorization",
                )

            if not user.is_active:
                raise serializers.ValidationError(
                    "User account is disabled.", code="authorization"
                )

            # Generate tokens using the parent class method
            refresh = self.get_token(user)
            access_token = refresh.access_token

            return {
                "refresh": str(refresh),
                "access": str(access_token),
                "token_type": "Bearer",
                "expires_in": access_token.payload["exp"]
                - access_token.payload["iat"],  # Token lifetime in seconds
                "refresh_expires_in": refresh.payload["exp"]
                - refresh.payload["iat"],  # Refresh token lifetime
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_active": user.is_active,
                    "is_staff": user.is_staff,
                    "date_joined": user.date_joined.isoformat(),
                    "last_login": user.last_login.isoformat()
                    if user.last_login
                    else None,
                },
            }
        else:
            raise serializers.ValidationError(
                'Must include "email" and "password".', code="authorization"
            )

    @classmethod
    def get_token(cls, user):
        """
        Override to add custom claims to the token if needed
        """
        token = super().get_token(user)

        # Add custom claims to the token
        token["email"] = user.email
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name
        token["username"] = user.username
        token["is_staff"] = user.is_staff
        token["user_id"] = user.id

        return token
