from rest_framework import views
from rest_framework.response import Response

from tout_doux.serializers.preferences import PreferencesSerializer


class PreferencesViewSet(views.APIView):
    serializer_class = PreferencesSerializer

    def get_queryset(self):
        return self.request.user.preferencess.first()

    def get(self, request, *args, **kwargs):
        settings = self.get_queryset()
        serializer = self.serializer_class(settings)

        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        settings = self.get_queryset()

        serializer = self.serializer_class(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)
