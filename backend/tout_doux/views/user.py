from django.contrib.auth import get_user_model
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ParseError, PermissionDenied
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from tout_doux.pagination import ExtendedPageNumberPagination
from tout_doux.serializers.user import UserSerializer, UserPatchSerializer, UserChangePassword, \
    UserEmailChangeSerializer, UserAccountState
from tout_doux.services.email import EmailService


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = ExtendedPageNumberPagination

    # Admin actions

    @action(
        detail=True,
        methods=['post'],
        url_path='account-state',
        url_name='account_state',
    )
    def change_account_state(self, request, pk=None):
        user = self.get_object()

        if user == request.user:
            raise PermissionDenied('You can\'t deactivate or activate your account.')

        serializer = UserAccountState(instance=user, data=request.data)

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=True,
        methods=['post'],
        url_path='resend-activation-email',
        url_name='resend_activation_email',
    )
    def resend_activation_email(self, request, pk=None):
        user = self.get_object()

        EmailService.send_user_creation_email(user)

        return Response(status=status.HTTP_204_NO_CONTENT)

    # User connected actions

    @action(detail=False, permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.serializer_class(request.user)
        return Response(serializer.data)

    @me.mapping.patch
    def update_connected_user(self, request):
        user = request.user
        serializer = UserPatchSerializer(data=request.data, instance=user, partial=True)

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[IsAuthenticated],
        url_path='me/change-password',
        url_name='change_password'
    )
    def change_password(self, request):
        serializer = UserChangePassword(data=request.data, context={'user': request.user})

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[IsAuthenticated],
        url_path='me/change-email',
        url_name='change_email'
    )
    def change_email(self, request):
        serializer = UserEmailChangeSerializer(data=request.data, context={'user': request.user})

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[IsAuthenticated],
        url_path='me/delete-account',
        url_name='delete_account'
    )
    def delete_account(self, request):
        request.user.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    # Non auth actions

    @action(
        detail=False,
        permission_classes=[AllowAny],
        url_path='is-username-unique',
        url_name='is_username_unique'
    )
    def is_username_unique(self, request):
        username = request.query_params.get('username')
        exclude_id = request.query_params.get('excludeId')

        if not username:
            raise ParseError('You must provide an username')

        query = self.get_queryset().filter(username=username)

        if exclude_id:
            query = query.exclude(id=exclude_id)

        if query.count() > 0:
            data = {'unique': False}
        else:
            data = {'unique': True}

        return Response(data)

    @action(
        detail=False,
        permission_classes=[AllowAny],
        url_path='is-email-unique',
        url_name='is_email_unique'
    )
    def is_email_unique(self, request):
        email = request.query_params.get('email')

        if not email:
            raise ParseError('You must provide an email')

        if self.get_queryset().filter(email=email).count() > 0:
            data = {'unique': False}
        else:
            data = {'unique': True}

        return Response(data)
