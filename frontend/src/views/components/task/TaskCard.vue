<script setup lang="ts">
import { Task, TaskPatch } from '@/models/task.model'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import TagGroup from '@/views/components/tag/TagGroup.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { getDialogWidth } from '@/utils/dialog.utils'
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'

const display = useDisplay()

const props = withDefaults(
  defineProps<{
    task: Task
    disabled?: boolean
    displayOptions?: boolean
    completable?: boolean
    small?: boolean
    selected?: boolean
    elevation?: number
    color: string | null
    itemName?: string
  }>(),
  { displayOptions: true, completable: true, elevation: 2, color: null, itemName: 'task' }
)

const emit = defineEmits<{
  'toggle-state': [id: number, value: boolean]
  update: [id: number, data: TaskPatch]
  delete: [id: number]
}>()

const taskMenu = ref(false)
const taskDialog = ref(false)
const uncompleteConfirmDialog = ref(false)
const deleteConfirmDialog = ref(false)

const cardColor = computed<string | null>(() =>
  props.task.completed || props.selected ? 'green darken-2' : props.color
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
      :elevation
      class="task-card rounded-lg"
      :class="{ 'pl-3 pt-3': !completable, 'cursor-pointer': !displayOptions, small }">
      <template v-if="displayOptions">
        <div class="task-card__actions">
          <v-menu v-model="taskMenu" offset-y>
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                size="x-small"
                variant="plain"
                class="task-card__actions__btn">
                <v-icon size="small">mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item @click="openEditDialog()">
                <v-icon size="small" start>mdi-pencil</v-icon>
                <v-list-item-title>Edit</v-list-item-title>
              </v-list-item>
              <v-list-item @click="openDeleteDialog()">
                <v-icon size="small" start>mdi-trash-can</v-icon>
                <v-list-item-title>Delete</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </template>

      <div class="task-card__content" :class="{ 'mb-1': small }">
        <template v-if="completable">
          <template v-if="task.completed">
            <v-btn icon @click="openUncompleteDialog()">
              <v-icon>mdi-checkbox-marked-outline</v-icon>
            </v-btn>
          </template>
          <template v-else>
            <v-btn icon @click="emitToggleStateEvent()">
              <v-icon>mdi-checkbox-blank-outline</v-icon>
            </v-btn>
          </template>
        </template>

        <div
          class="flex-grow-1 font-weight-medium text-white"
          :class="{ 'text-body-2': small, 'text-body-1': !small }"
          :title="task.name">
          {{ task.name }}
        </div>
      </div>

      <template v-if="task.tags.length">
        <TagGroup
          :tag-list="task.tags"
          :small="small"
          max-tag="3"
          :class="{ 'pl-10': completable }">
        </TagGroup>
      </template>
    </v-card>

    <v-dialog v-model="taskDialog" :width="getDialogWidth()" :fullscreen="display.smAndDown">
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
        <v-icon size="x-large">mdi-trophy</v-icon>
      </template>
      <span>Are you sure to uncomplete this task ?</span>
    </ConfirmDialog>

    <ConfirmDialog v-model="deleteConfirmDialog" @confirm="emitDeleteEvent()">
      <template #icon>
        <v-icon size="x-large">mdi-trash-can</v-icon>
      </template>
      <span>Are you sure to delete this task ?</span>
    </ConfirmDialog>
  </div>
</template>

<style scoped lang="scss">
@import 'vuetify/settings';

.task-card {
  min-height: 72px;
  height: 100%;
  padding: 8px 20px 8px 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  &.small {
    min-height: 62px;
  }

  &__actions {
    position: absolute;
    top: 4px;
    right: 4px;

    &__btn {
      min-width: 0 !important;
      padding: 0 !important;
    }
  }

  &__content {
    display: flex;
    align-items: center;
    column-gap: 4px;
  }
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
  .task-card {
    padding: 8px 24px 8px 8px;

    &__actions {
      right: 8px;
    }
  }
}
</style>
