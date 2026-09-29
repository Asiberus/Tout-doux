from django.db import models, transaction
from django.db.models import F, Min, Q
from django.dispatch import receiver
from fractional_indexing import generate_key_between

from tout_doux.models.collection import Collection
from tout_doux.models.project import Project
from tout_doux.models.section import Section
from tout_doux.models.tag import Tag
from tout_doux.models.user import UserRelatedModel
from tout_doux.services import ordering


class Task(UserRelatedModel):
    name = models.CharField(max_length=150)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, editable=False)
    tags = models.ManyToManyField(
        Tag,
        limit_choices_to={'type': Tag.Type.TASK},
        related_name='tasks',
        blank=True
    )
    project = models.ForeignKey(
        Project,
        limit_choices_to={'archived': False},
        on_delete=models.CASCADE,
        related_name='tasks',
        null=True,
        blank=True
    )
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        related_name='tasks',
        null=True,
        blank=True
    )
    collection = models.ForeignKey(
        Collection,
        limit_choices_to={'archived': False},
        on_delete=models.CASCADE,
        related_name='tasks',
        null=True,
        blank=True
    )
    position = models.CharField(max_length=255, db_collation='C', editable=False)

    class Meta:
        ordering = ('completed', F('completed_at').desc(nulls_last=True), 'position', '-pk')
        constraints = (
            models.UniqueConstraint(
                fields=('project', 'section', 'collection', 'position'),
                nulls_distinct=False,
                name='unique_task_position_per_list',
            ),
            models.CheckConstraint(
                condition=(
                    Q(project__isnull=False, section__isnull=True, collection__isnull=True)
                    | Q(project__isnull=True, section__isnull=False, collection__isnull=True)
                    | Q(project__isnull=True, section__isnull=True, collection__isnull=False)
                ),
                name='task_exactly_one_container',
            ),
        )

    def __str__(self):
        return 'project : {0} - task : {1} - completed : {2}'.format(self.project, self.name, self.completed)

    def list_queryset(self):
        return Task.objects.filter(
            project_id=self.project_id,
            section_id=self.section_id,
            collection_id=self.collection_id,
        )

    def lock_list(self):
        """Verrouille le conteneur jusqu'à la fin de la transaction : deux écritures d'ordre sur
        la même liste calculeraient sinon leur clé sur le même état."""
        if self.section_id is not None:
            return (
                Section.objects.select_related('project')
                .select_for_update(of=('self',))
                .get(pk=self.section_id)
            )
        if self.project_id is not None:
            return Project.objects.select_for_update().get(pk=self.project_id)
        if self.collection_id is not None:
            return Collection.objects.select_for_update().get(pk=self.collection_id)
        return None

    def save(self, *args, after_id=None, before_id=None, **kwargs):
        if not self._state.adding or self.position:
            return super().save(*args, **kwargs)

        with transaction.atomic():
            self.lock_list()
            if after_id is None and before_id is None:
                first = self.list_queryset().aggregate(first=Min('position'))['first']
                self.position = generate_key_between(None, first)
            else:
                left, right = ordering.neighbours(self, after_id, before_id, Q(completed=False))
                self.position = generate_key_between(left, right)
            super().save(*args, **kwargs)


@receiver(models.signals.pre_delete, sender=Task)
def feed_daily_task_name(sender, instance, **kwargs):
    for daily_task in instance.daily_tasks.all():
        daily_task.name = instance.name
        daily_task.tags.add(*instance.tags.all())
        daily_task.save()
