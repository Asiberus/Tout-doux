from django.contrib.auth import get_user_model
from rest_framework import viewsets, status
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from tout_doux.serializers.user import UserRegisterSerializer, UserSerializer, UserActivationSerializer


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class UserRegisterView(CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]


class UserActivationView(CreateAPIView):
    serializer_class = UserActivationSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        super().post(request, *args, **kwargs)

        return Response(status=status.HTTP_204_NO_CONTENT)
