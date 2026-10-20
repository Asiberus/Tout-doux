<script setup lang="ts">
import { Task, TaskPatch } from '@/models/task.model'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import TaskDateBadge from '@/views/components/task/TaskDateBadge.vue'
import TagGroup from '@/views/components/tag/TagGroup.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import SortableHandle from '@/components/sortable/SortableHandle.vue'
import { useDialogWidth } from '@/composables/useDialogWidth'
import { useToday } from '@/composables/useToday'
import { SetHandle } from '@/utils/sortable.utils'
import { SURFACE_LEVELS, SurfaceLevel } from '@/utils/surface.utils'
import { computed, ref } from 'vue'

const { dialogWidth, dialogFullscreen } = useDialogWidth()
const { today } = useToday()

const props = withDefaults(
  defineProps<{
    task: Task
    disabled?: boolean
    displayOptions?: boolean
    completable?: boolean
    small?: boolean
    selected?: boolean
    level?: SurfaceLevel
    itemName?: string
    setHandle?: SetHandle
    atTop?: boolean
    showCompletedAt?: boolean
    showDueDate?: boolean
    referenceDay?: string
  }>(),
  {
    displayOptions: true,
    completable: true,
    level: 1,
    itemName: 'task',
    showCompletedAt: true,
    showDueDate: true,
    referenceDay: undefined,
  }
)

const emit = defineEmits<{
  'add-to-daily': [id: number]
  'toggle-state': [id: number, value: boolean]
  update: [id: number, data: TaskPatch]
  delete: [id: number]
  'move-to-top': [id: number]
}>()

const taskMenu = ref(false)
const taskDialog = ref(false)
const uncompleteConfirmDialog = ref(false)
const deleteConfirmDialog = ref(false)

const cardColor = computed<string>(() =>
  props.task.completed || props.selected ? 'green-darken-2' : SURFACE_LEVELS[props.level]
)
const displayCompletedAt = computed<boolean>(
  () => props.showCompletedAt && props.task.completed && !!props.task.completedAt
)
const displayDueDate = computed<boolean>(
  () => props.showDueDate && !props.task.completed && !!props.task.dueDate
)
const badgeReferenceDay = computed<string>(
  () => props.referenceDay ?? today.value.format('YYYY-MM-DD')
)

function openEditDialog(): void {
  taskDialog.value = true
}

function openDeleteDialog(): void {
  deleteConfirmDialog.value = true
}

function openUncompleteDialog(): void {
  uncompleteConfirmDialog.value = true
}

function emitAddToDailyEvent(): void {
  emit('add-to-daily', props.task.id)
}

function emitMoveToTopEvent(): void {
  emit('move-to-top', props.task.id)
}

function emitToggleStateEvent(): void {
  emit('toggle-state', props.task.id, !props.task.completed)
}

function emitUpdateEvent(data: TaskPatch): void {
  taskDialog.value = false
  emit('update', props.task.id, data)
}

function emitDeleteEvent(): void {
  emit('delete', props.task.id)
}
</script>

<template>
  <div>
    <v-card
      :disabled="disabled || selected"
      :color="cardColor"
      :ripple="false"
      :elevation="2"
      class="task-card rounded-lg"
      :class="{
        'task-card--not-completable': !completable,
        'task-card--sortable': setHandle,
        small,
      }">
      <SortableHandle v-if="setHandle" :set-handle :label="`Reorder ${task.name}`" />

      <div class="task-card__row">
        <div
          class="task-card__content"
          :class="{
            'task-card__content--meta': $slots.meta,
            'task-card__content--badge': !$slots.meta && (displayDueDate || displayCompletedAt),
          }">
          <template v-if="completable">
            <template v-if="task.completed">
              <v-btn icon variant="text" density="comfortable" @click="openUncompleteDialog()">
                <v-icon icon="mdi-checkbox-marked-outline" />
              </v-btn>
            </template>
            <template v-else>
              <v-btn icon variant="text" density="comfortable" @click="emitToggleStateEvent()">
                <v-icon icon="mdi-checkbox-blank-outline" />
              </v-btn>
            </template>
          </template>

          <div
            class="flex-grow-1 font-weight-medium text-white"
            :class="{ 'text-body-medium': small, 'text-body-large': !small }"
            :title="task.name">
            {{ task.name }}
          </div>
          <TaskDateBadge
            v-if="displayCompletedAt"
            :date="task.completedAt"
            :due-date="task.dueDate"
            :reference-day="badgeReferenceDay"
            kind="completed"
            class="flex-shrink-0" />
          <TaskDateBadge
            v-if="displayDueDate && task.dueDate"
            :date="task.dueDate"
            :reference-day="badgeReferenceDay"
            class="flex-shrink-0" />
          <slot name="meta" />
        </div>
        <slot name="actions" />
        <template v-if="displayOptions">
          <div class="task-card__actions">
            <v-menu v-model="taskMenu">
              <template #activator="{ props: menuProps }">
                <v-btn
                  v-bind="menuProps"
                  icon
                  variant="text"
                  size="small"
                  density="comfortable"
                  class="task-card__actions__btn">
                  <v-icon icon="mdi-dots-vertical" />
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item v-if="!task.completed" @click="emitAddToDailyEvent()">
                  <v-list-item-title class="d-flex align-center">
                    <v-icon icon="mdi-calendar-plus" size="small" start />
                    Add to daily
                  </v-list-item-title>
                </v-list-item>
                <v-list-item v-if="setHandle && !atTop" @click="emitMoveToTopEvent()">
                  <v-list-item-title class="d-flex align-center">
                    <v-icon icon="mdi-arrow-collapse-up" size="small" start />
                    Move to top
                  </v-list-item-title>
                </v-list-item>
                <v-list-item @click="openEditDialog()">
                  <v-list-item-title class="d-flex align-center">
                    <v-icon icon="mdi-pencil" size="small" start />
                    Edit
                  </v-list-item-title>
                </v-list-item>
                <v-list-item @click="openDeleteDialog()">
                  <v-list-item-title class="d-flex align-center">
                    <v-icon icon="mdi-trash-can" size="small" start />
                    Delete
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>
      </div>

      <TagGroup
        v-if="task.tags.length"
        :tag-list="task.tags"
        :small="small"
        :max-tag="3"
        class="task-card__tags"
        :class="{ 'pl-10': completable }" />
    </v-card>

    <v-dialog v-model="taskDialog" :width="dialogWidth" :fullscreen="dialogFullscreen">
      <TaskDialog
        :task="task"
        :is-dialog-open="taskDialog"
        :item-name="itemName"
        @update="emitUpdateEvent($event)"
        @close="taskDialog = false">
      </TaskDialog>
    </v-dialog>

    <ConfirmDialog v-model="uncompleteConfirmDialog" @confirm="emitToggleStateEvent()">
      <template #icon>
        <v-icon icon="mdi-trophy" size="x-large" />
      </template>
      <span>Are you sure to uncomplete this task ?</span>
    </ConfirmDialog>

    <ConfirmDialog v-model="deleteConfirmDialog" @confirm="emitDeleteEvent()">
      <template #icon>
        <v-icon icon="mdi-trash-can" size="x-large" />
      </template>
      <span>Are you sure to delete this task ?</span>
    </ConfirmDialog>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use '@/styles/breakpoints' as variables;

.task-card {
  min-height: 72px;
  height: 100%;
  padding: 8px 12px 8px 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  &.small {
    min-height: 62px;
    row-gap: 4px;
  }

  &.task-card--not-completable {
    padding-left: 12px;
  }

  &.task-card--sortable {
    @media (hover: hover) {
      padding-left: var(--sortable-gutter-width);
    }
  }

  &__actions {
    &__btn {
      min-width: 0 !important;
    }
  }

  &__row {
    display: flex;
    align-items: center;
    column-gap: 4px;
  }

  &__content {
    flex-grow: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    column-gap: 4px;
  }

  &__content--meta {
    flex-wrap: wrap-reverse;
    gap: 8px;
  }

  &__content--badge {
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 4px 8px;
  }
}

@media #{map.get(variables.$display-breakpoints, 'sm-and-up')} {
  .task-card {
    padding: 8px 16px 8px 8px;

    &.task-card--not-completable {
      padding-left: 16px;
    }
  }
}
</style>
