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
        try:
            access_token = AccessToken(token)
            user_id = access_token.get("user_id")
            return {"valid": True, "user_id": user_id}, 200
        except TokenError:
            return {"valid": False, "user_id": None}, 401
        except Exception:
            return {"valid": False, "user_id": None}, 401

    def post(self, request):
        token = self.get_token_from_request(request)
        result = self.verify_token(token)
        return Response(result, status=status.HTTP_200_OK)

    def get(self, request):
        token = self.get_token_from_request(request)
        print(token)
        result, status = self.verify_token(token)
        print(result, status)

        response = Response(result, status=status)
        if result["valid"]:
            response["X-User-ID"] = str(result["user_id"])
        return response
