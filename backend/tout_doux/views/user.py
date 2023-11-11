from django.contrib.auth import get_user_model
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ParseError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from tout_doux.serializers.user import UserSerializer, UserPatchSerializer, UserChangePassword


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer

    @action(detail=False)
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

    @action(detail=False, methods=['post'], url_path='me/change-password', url_name='connected_user_change_password')
    def change_password(self, request):
        serializer = UserChangePassword(data=request.data, context={'user': request.user})

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, permission_classes=[AllowAny], url_path='is-username-unique', url_name='is_username_unique')
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

    @action(detail=False, permission_classes=[AllowAny], url_path='is-email-unique', url_name='is_email_unique')
    def is_email_unique(self, request):
        email = request.query_params.get('email')

        if not email:
            raise ParseError('You must provide an email')

        if self.get_queryset().filter(email=email).count() > 0:
            data = {'unique': False}
        else:
            data = {'unique': True}

        return Response(data)
