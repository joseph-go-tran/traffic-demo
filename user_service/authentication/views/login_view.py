from rest_framework_simplejwt.views import TokenObtainPairView

from authentication.serializers.login_serializer import (
    EmailTokenObtainPairSerializer,
)


class EmailLoginView(TokenObtainPairView):
    """
    Custom login view that uses email instead of username for authentication.
    """

    serializer_class = EmailTokenObtainPairSerializer
