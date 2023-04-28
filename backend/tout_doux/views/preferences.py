from rest_framework.response import Response
from rest_framework.views import APIView

from tout_doux.models import Preferences
from tout_doux.serializers.preferences import PreferencesSerializer


class PreferencesViewSet(APIView):
    # Todo : Change when user is implemented
    def get(self, request, *args, **kwargs):
        settings, _created = Preferences.objects.get_or_create()
        serializer = PreferencesSerializer(settings)

        return Response(serializer.data)

    # Todo : Change when user is implemented
    def patch(self, request, *args, **kwargs):
        instance = Preferences.objects.first()
        serializer = PreferencesSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)
