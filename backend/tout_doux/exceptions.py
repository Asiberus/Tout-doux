from rest_framework import status
from rest_framework.exceptions import APIException


class AlreadyInDailyError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'This task is already in today\'s daily'
