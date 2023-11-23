from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from knox.views import LoginView as KnoxLoginView
from rest_framework import status
from rest_framework.exceptions import ParseError
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from tout_doux.auth.json_authentication import EmailPasswordAuthentication
from tout_doux.serializers.auth import ResetPasswordRequestSerializer, ResetPasswordSerializer, \
    ConfirmEmailChangeSerializer, CheckPasswordSerializer
from tout_doux.serializers.user import UserRegisterSerializer, UserActivationSerializer
from tout_doux.services.email import EmailService
from tout_doux.utils.token import decode_uid, check_token


class LoginView(KnoxLoginView):
    authentication_classes = [EmailPasswordAuthentication]
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


class ResendActivationEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_model = get_user_model()
        uidb64 = request.data.get('uidb64')

        if not uidb64 or type(uidb64) != str:
            raise ParseError('You must provide an uidb64')

        try:
            uid = decode_uid(uidb64)
            user = user_model.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, user_model.DoesNotExist):
            raise ParseError('User not found')

        EmailService.send_user_creation_email(user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResetPasswordRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordRequestSerializer(data=request.data)
        if serializer.is_valid(raise_exception=False):
            user = serializer.validated_data
            EmailService.send_reset_password_email(user)

        return Response(status=status.HTTP_204_NO_CONTENT)


class ResetPasswordView(CreateAPIView):
    serializer_class = ResetPasswordSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        super().post(request, *args, **kwargs)

        return Response(status=status.HTTP_204_NO_CONTENT)


class ValidatePasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        password = request.data.get('password')

        if not password or type(password) != str:
            raise ParseError('You must provide a password')

        error_messages = []
        try:
            validate_password(password=password)
        except ValidationError as error:
            error_messages = error.messages

        return Response({'errors': error_messages})


class ConfirmEmailView(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = ConfirmEmailChangeSerializer

    def post(self, request, *args, **kwargs):
        super().post(request, *args, **kwargs)

        return Response(status=status.HTTP_204_NO_CONTENT)


class CheckTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_model = get_user_model()
        uidb64, token = request.data.get('uidb64'), request.data.get('token')

        if not uidb64 or not token or type(uidb64) != str or type(token) != str:
            raise ParseError('You must provide an id and a token')

        try:
            uid = decode_uid(uidb64)
            user = user_model.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, user_model.DoesNotExist):
            raise ParseError('User not found')

        return Response({'valid': check_token(user, token)})


class CheckPasswordView(APIView):
    def post(self, request):
        serializer = CheckPasswordSerializer(data=request.data, context={'user': request.user})
        serializer.is_valid(raise_exception=True)

        return Response({'valid': True})
