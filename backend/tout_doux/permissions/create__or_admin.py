from rest_framework.permissions import BasePermission


class CreateOrAdmin(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True

        print(request.method)
        return request.method in ('POST', 'HEAD', 'OPTIONS')

