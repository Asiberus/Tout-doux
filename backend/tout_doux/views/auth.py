from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from knox.views import LoginView as KnoxLoginView
from rest_framework import status
from rest_framework.exceptions import ParseError
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from tout_doux.auth.json_authentication import JsonAuthentication
from tout_doux.serializers.auth import PasswordResetRequestSerializer, PasswordResetSerializer
from tout_doux.serializers.user import UserRegisterSerializer, UserActivationSerializer
from tout_doux.services.email import EmailService


class LoginView(KnoxLoginView):
    authentication_classes = [JsonAuthentication]
    permission_classes = [AllowAny]


class UserRegisterView(CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]


class UserActivationView(CreateAPIView):
    serializer_class = UserActivationSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        super().post(request, *args, **kwargs)

        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid(raise_exception=False):
            user = serializer.validated_data
            EmailService.send_reset_password_email(user)

        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetView(CreateAPIView):
    serializer_class = PasswordResetSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        super().post(request, *args, **kwargs)

        return Response(status=status.HTTP_204_NO_CONTENT)


class ValidatePasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        password = request.data.get('password')

        if not password:
            raise ParseError('You must provide a password')

        error_messages = []
        try:
            validate_password(password=password)
        except ValidationError as error:
            error_messages = error.messages

        return Response({'errors': error_messages})
