from collections import OrderedDict

from django.conf import settings
from django.core.paginator import Paginator
from rest_framework import pagination
from rest_framework.response import Response


class ExtendedPageNumberPagination(pagination.PageNumberPagination):
    page_size = settings.EXTENDED_PAGINATION_DEFAULT_SIZE
    page_size_query_param = settings.EXTENDED_PAGINATION_DEFAULT_SIZE_QUERY_PARAM

    def paginate_queryset(self, queryset, request, view=None):
        self.page_size = super().get_page_size(request)
        if not self.page_size:
            return None

        paginator = Paginator(queryset, self.page_size)
        page_number = request.query_params.get(super().page_query_param)

        self.page = paginator.get_page(page_number)
        self.request = request

        return list(self.page)

    def get_paginated_response(self, data):
        return Response(OrderedDict([
            ('count', self.page.paginator.count),
            ('page', self.page.number),
            ('size', self.page_size),
            ('first', not self.page.has_previous()),
            ('last', not self.page.has_next()),
            ('content', data)
        ]))
