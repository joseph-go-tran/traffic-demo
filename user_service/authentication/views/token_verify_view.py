from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


class TokenVerifyView(APIView):
    """
    API endpoint to verify JWT access token
    and return validation status with user_id.

    POST /api/auth/token/verify/
    Body: {"token": "your_access_token_here"}

    Returns:
    - {"valid": true, "user_id": 123} - Token is valid
    - {"valid": false, "user_id": null} - Token is invalid/expired
    """

    permission_classes = []
    authentication_classes = []

    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response(
                {"valid": False, "user_id": None}, status=status.HTTP_200_OK
            )

        try:
            # Validate and decode the token
            access_token = AccessToken(token)

            # Extract user_id from token
            user_id = access_token.get("user_id")

            return Response(
                {"valid": True, "user_id": user_id}, status=status.HTTP_200_OK
            )

        except TokenError:
            # Token is invalid, expired, or blacklisted
            return Response(
                {"valid": False, "user_id": None}, status=status.HTTP_200_OK
            )
        except Exception:
            # Any other error
            return Response(
                {"valid": False, "user_id": None}, status=status.HTTP_200_OK
            )
