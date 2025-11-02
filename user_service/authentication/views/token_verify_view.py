from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


class TokenVerifyView(APIView):
    """
    API endpoint to verify JWT access token
    via either POST body (client) or Authorization header (Traefik).

    Supports:
    - POST /api/auth/token/verify/  (Body: {"token": "..."})
    - GET /api/auth/token/verify/   (Header: Authorization: Bearer <token>)
    """

    permission_classes = []
    authentication_classes = []

    def get_token_from_request(self, request):
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return auth_header.split(" ", 1)[1]

        if hasattr(request, "data"):
            return request.data.get("token")

        return None

    def verify_token(self, token):
        if not token:
            return {
                "valid": False,
                "user_id": None,
            }, status.HTTP_401_UNAUTHORIZED

        try:
            access_token = AccessToken(token)
            user_id = access_token.get("user_id")
            return {"valid": True, "user_id": user_id}, status.HTTP_200_OK
        except TokenError:
            return {
                "valid": False,
                "user_id": None,
            }, status.HTTP_401_UNAUTHORIZED
        except Exception:
            return {
                "valid": False,
                "user_id": None,
            }, status.HTTP_401_UNAUTHORIZED

    def post(self, request):
        token = self.get_token_from_request(request)
        result, code = self.verify_token(token)
        return Response(result, status=code)

    def get(self, request):
        token = self.get_token_from_request(request)
        print(token)
        result, code = self.verify_token(token)
        print("Token verification result:", result)
        print("Token verification status:", code)

        response = Response(result, status=code)
        if result["valid"]:
            response["X-User-ID"] = str(result["user_id"])
        return response
