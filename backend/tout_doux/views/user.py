from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from tout_doux.serializers.user import UserSerializer


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer

    @action(detail=False)
    def me(self, request):
        serializer = self.serializer_class(request.user)
        return Response(serializer.data)
