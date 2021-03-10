from django.contrib import admin

from tout_doux.models.project import Project
from tout_doux.models.task import Task

admin.site.register(Project)
admin.site.register(Task)