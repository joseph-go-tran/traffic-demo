from rest_framework import generics
from rest_framework.permissions import AllowAny

from authentication.models import Customer
from authentication.serializers import RegisterSerializer


class RegisterView(generics.CreateAPIView):
    queryset = Customer.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
