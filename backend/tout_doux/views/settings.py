from rest_framework.response import Response
from rest_framework.views import APIView

from tout_doux.models import Settings
from tout_doux.serializers.settings import SettingsSerializer


class SettingsViewSet(APIView):
    # Todo : Change when user is implemented
    def get(self, request, *args, **kwargs):
        settings, _created = Settings.objects.get_or_create()
        serializer = SettingsSerializer(settings)

        return Response(serializer.data)

    # Todo : Change when user is implemented
    def patch(self, request, *args, **kwargs):
        instance = Settings.objects.first()
        serializer = SettingsSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)
