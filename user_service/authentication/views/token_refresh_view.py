from rest_framework_simplejwt.views import TokenRefreshView

from authentication.serializers.token_refresh_serializer import (
    CustomTokenRefreshSerializer,
)


class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom token refresh view that returns additional information
    """

    serializer_class = CustomTokenRefreshSerializer
