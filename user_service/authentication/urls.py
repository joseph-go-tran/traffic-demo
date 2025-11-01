from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView

from authentication.views import (
    CustomTokenRefreshView,
    EmailLoginView,
    RegisterView,
    TokenVerifyView,
)

urlpatterns = [
    path("login/", EmailLoginView.as_view(), name="email_login"),
    path("logout/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("register/", RegisterView.as_view(), name="auth_register"),
]
