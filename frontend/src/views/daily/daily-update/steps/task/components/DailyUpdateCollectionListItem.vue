<script setup lang="ts">
import { DailyTask } from '@/models/daily-task.model'
import { Task, TaskPost } from '@/models/task.model'
import { CollectionDetail } from '@/models/collection.model'
import TaskCard from '@/views/components/task/TaskCard.vue'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import TaskCounter from '@/components/TaskCounter.vue'
import { useDialogWidth } from '@/composables/useDialogWidth'
import { computed, ref } from 'vue'

const { dialogWidth, dialogFullscreen } = useDialogWidth()

const selected = defineModel<boolean>('selected')

const props = defineProps<{
  collection: CollectionDetail
  dailyTaskList: DailyTask[]
}>()

const emit = defineEmits<{
  'select-task': [data: { taskId: number }]
  'create-task': [data: { task: TaskPost; collectionId: number }]
}>()

const taskDialog = ref(false)

const tasksCompleted = computed<Task[]>(() =>
  props.collection.tasks.filter(({ completed }) => completed)
)

const tasksUncompleted = computed<Task[]>(() =>
  props.collection.tasks.filter(({ completed }) => !completed)
)

const percentageOfTaskCompleted = computed<number>(
  () => (tasksCompleted.value.length / props.collection.tasks.length) * 100
)

function isTaskSelected(task: Task): boolean {
  return props.dailyTaskList.some((dailyTask: DailyTask) => task.id === dailyTask.task?.id)
}

function selectCollection(): void {
  if (tasksUncompleted.value.length !== 0 && !selected.value) selected.value = true
}

function unselectCollection(): void {
  selected.value = false
}

function selectTask(task: Task): void {
  if (isTaskSelected(task)) return

  emit('select-task', { taskId: task.id })
}

function createTask(data: TaskPost): void {
  taskDialog.value = false
  emit('create-task', {
    task: { ...data, collectionId: props.collection.id },
    collectionId: props.collection.id,
  })
}
</script>

<template>
  <div class="collection-card-wrapper" :class="{ selected }" @click="selectCollection()">
    <v-card
      :disabled="tasksUncompleted.length === 0"
      :class="{ 'cursor-pointer': !selected }"
      class="rounded-lg">
      <v-progress-linear
        :model-value="percentageOfTaskCompleted"
        color="collection"
        height="4"
        class="flex-shrink-0" />
      <v-card-text>
        <div class="d-flex align-center">
          <h3
            class="text-body-h1 text-sm-title-large text-white"
            :class="{ 'text-truncate': !selected }"
            :title="collection.name">
            {{ collection.name }}
          </h3>
          <template v-if="!selected">
            <v-spacer />
            <TaskCounter
              :value="tasksCompleted.length"
              :max="collection.tasks.length"
              :show-icon="false"
              class="ml-2" />
          </template>
          <template v-if="selected">
            <v-btn
              :to="{ name: 'collection-detail', params: { id: collection.id } }"
              icon
              variant="text"
              density="comfortable"
              size="small"
              class="ml-1"
              color="grey"
              title="Go to collection">
              <v-icon icon="mdi-open-in-new" size="small" />
            </v-btn>
            <v-spacer />
            <v-btn icon variant="text" density="comfortable" @click.stop="unselectCollection">
              <v-icon icon="mdi-close" />
            </v-btn>
          </template>
        </div>
        <template v-if="selected">
          <v-divider class="mt-2" />
          <div class="task-wrapper">
            <TaskCard
              v-for="task of tasksUncompleted"
              :key="`task-${task.id}`"
              :task
              :selected="isTaskSelected(task)"
              :class="{ 'cursor-pointer': !isTaskSelected(task) }"
              :small="true"
              :completable="false"
              :display-options="false"
              :elevation="3"
              color="grey-darken-4"
              @click="selectTask(task)">
            </TaskCard>

            <v-card variant="outlined" ripple class="create-task-card" @click="taskDialog = true">
              <v-card-text class="d-flex align-center justify-center gap-2">
                <span class="text-body-medium text-sm-body-large font-weight-medium">
                  Create a {{ collection.itemName }}
                </span>
              </v-card-text>
            </v-card>

            <v-dialog v-model="taskDialog" :width="dialogWidth" :fullscreen="dialogFullscreen">
              <TaskDialog
                :is-dialog-open="taskDialog"
                :item-name="collection.itemName"
                @create="createTask($event)"
                @close="taskDialog = false" />
            </v-dialog>
          </div>
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/colors';
@use '@/styles/breakpoints' as variables;

.selected {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  cursor: default;

  & > .v-card {
    height: 100%;

    .v-card-text {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    @media #{map.get(variables.$display-breakpoints, 'xs')} {
      .v-card-text {
        padding: 12px;
      }
    }

    .task-wrapper {
      flex-grow: 1;
      overflow-y: auto;
      padding: 12px 0;
      display: grid;
      // auto fit with 260px min size but max 2 column
      grid-template-columns: repeat(auto-fill, minmax(max(260px, calc((100% - 8px) / 2)), 1fr));
      grid-auto-rows: min-content;
      gap: 8px;
    }
  }
}

.collection-card-wrapper:not(.selected) .v-card-text {
  padding: 16px;
}

.create-task-card {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-style: dashed;
  color: map.get(colors.$grey, 'darken-3');
  transition: color 0.2s ease-in-out;

  @media (hover: hover) {
    &:hover {
      color: map.get(colors.$grey, 'darken-1');
    }
  }
}
</style>
