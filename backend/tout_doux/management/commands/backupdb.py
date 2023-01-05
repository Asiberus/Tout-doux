import io

from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        backup = io.StringIO()
        call_command('dumpdata',
                     exclude=['contenttypes', 'sessions.session', 'admin.logentry'],
                     format='json',
                     stdout=backup)

        self.stdout.write(backup.getvalue())
