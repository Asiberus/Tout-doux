<script setup lang="ts">
import { DailyTask } from '@/models/daily-task.model'
import { Task } from '@/models/task.model'
import { CollectionDetail } from '@/models/collection.model'
import TaskCard from '@/views/components/task/TaskCard.vue'
import TaskCounter from '@/components/TaskCounter.vue'
import { computed } from 'vue'

const selected = defineModel<boolean>('selected')

const props = defineProps<{
  collection: CollectionDetail
  dailyTaskList: DailyTask[]
}>()

const emit = defineEmits<{
  'select-task': [data: { taskId: number }]
}>()

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
</script>

<template>
  <div class="collection-card-wrapper" :class="{ selected }" @click="selectCollection()">
    <v-card
      :disabled="tasksUncompleted.length === 0"
      :class="{ 'cursor-pointer': !selected }"
      class="rounded-lg">
      <v-progress-linear
        :model-value="percentageOfTaskCompleted"
        color="collection lighten-2"
        height="4"
        class="flex-shrink-0" />
      <v-card-text>
        <div class="d-flex align-center">
          <h3
            class="text-body-h1 text-sm-h6 text-white"
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
            <v-hover v-slot="{ hover }">
              <v-btn
                :to="{ name: 'collection-detail', params: { id: collection.id } }"
                icon
                size="small"
                :color="hover ? 'grey' : 'grey darken-3'"
                class="ml-1"
                title="Go to collection">
                <v-icon size="small">mdi-open-in-new</v-icon>
              </v-btn>
            </v-hover>
            <v-spacer />
            <v-btn color="red" icon @click.stop="unselectCollection">
              <v-icon>mdi-close</v-icon>
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
              elevation="3"
              color="grey-darken-4"
              @click.native="selectTask(task)">
            </TaskCard>
          </div>
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

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

    .v-card__text {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    @media #{map.get(variables.$display-breakpoints, 'xs')} {
      .v-card__text {
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

.collection-card-wrapper:not(.selected) .v-card__text {
  padding: 16px;
}
</style>
