<script setup lang="ts">
import { DailyTask } from '@/models/daily-task.model'
import { ProjectDetail } from '@/models/project.model'
import { Task } from '@/models/task.model'
import TaskCard from '@/views/components/task/TaskCard.vue'
import TagGroup from '@/views/components/tag/TagGroup.vue'
import ProgressDisk from '@/components/ProgressDisk.vue'
import TaskCounter from '@/components/TaskCounter.vue'
import { computed, ref, watch } from 'vue'

const selected = defineModel<boolean>('selected')

const props = withDefaults(
  defineProps<{
    project: ProjectDetail
    dailyTaskList: DailyTask[]
    sectionSelected?: number
  }>(),
  { sectionSelected: 0 }
)

const emit = defineEmits<{
  'select-task': [data: { taskId: number }]
}>()

const sectionTab = ref(0)

const taskBySection = computed<{ id: number; name: string; tasks: Task[] }[]>(() => {
  const sections = props.project.sections
    .filter(({ tasks }) => tasks.some(({ completed }) => !completed))
    .map(section => ({
      id: section.id,
      name: section.name,
      tasks: section.tasks,
    }))

  if (props.project.tasks.some(({ completed }) => !completed))
    sections.unshift({
      id: 0,
      name: 'General tasks',
      tasks: props.project.tasks,
    })

  return sections
})

const allTasks = computed<Task[]>(() =>
  props.project.tasks.concat(props.project.sections.map(({ tasks }) => tasks).flat())
)
const allTasksCompleted = computed<Task[]>(() =>
  allTasks.value.filter(({ completed }) => completed)
)
const allTasksUncompleted = computed<Task[]>(() =>
  allTasks.value.filter(({ completed }) => !completed)
)
const percentageOfTaskCompleted = computed<number>(
  () => (allTasksCompleted.value.length / allTasks.value.length) * 100
)

watch(
  () => props.sectionSelected,
  (value: number) => {
    sectionTab.value = taskBySection.value.findIndex(({ id }) => id === value) ?? 0
  }
)

function isTaskSelected(task: Task): boolean {
  return props.dailyTaskList.some((dailyTask: DailyTask) => task.id === dailyTask.task?.id)
}

function selectProject(): void {
  if (allTasksUncompleted.value.length === 0 || selected.value) return

  sectionTab.value = 0
  selected.value = true
}

function unselectProject(): void {
  selected.value = false
}

function selectTask(task: Task): void {
  if (isTaskSelected(task)) return

  emit('select-task', { taskId: task.id })
}
</script>

<template>
  <div :class="{ selected }" @click="selectProject()">
    <v-card
      :disabled="allTasksUncompleted.length === 0"
      :class="{ 'cursor-pointer': !selected }"
      class="project-card rounded-lg">
      <v-progress-linear
        :model-value="percentageOfTaskCompleted"
        color="green-accent-2"
        height="4"
        class="flex-shrink-0" />
      <v-card-text class="pa-3 pa-sm-4">
        <div class="d-flex align-center">
          <div class="min-width-0">
            <h3
              class="text-body-h1 text-sm-h6 text-white"
              :class="{ 'text-truncate': !selected }"
              :title="project.name">
              {{ project.name }}
            </h3>

            <template v-if="!selected">
              <template v-if="project.tags.length > 0">
                <TagGroup :tag-list="project.tags" :small="true" class="mt-1" />
              </template>
            </template>
          </div>

          <template v-if="!selected">
            <v-spacer />
            <TaskCounter
              :value="allTasksCompleted.length"
              :max="allTasks.length"
              :show-icon="false"
              class="ml-2" />
          </template>
          <template v-if="selected">
            <v-hover v-slot="{ hover }">
              <v-btn
                :to="{ name: 'project-detail', params: { id: project.id } }"
                icon
                size="small"
                :color="hover ? 'grey' : 'grey darken-3'"
                class="mx-1"
                title="Go to project">
                <v-icon size="small">mdi-open-in-new</v-icon>
              </v-btn>
            </v-hover>

            <v-spacer />

            <v-btn color="red" icon @click.stop="unselectProject()">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
        </div>

        <template v-if="selected">
          <template v-if="project.tags.length > 0">
            <TagGroup :tag-list="project.tags" class="my-1 flex-shrink-0" />
          </template>

          <v-tabs
            v-if="taskBySection.length > 1 || taskBySection[0].id !== 0"
            v-model="sectionTab"
            color="accent"
            class="section-wrapper"
            hide-slider
            show-arrows>
            <v-tab v-for="section of taskBySection" :key="`tab-${section.id}`">
              <span class="text-truncate" :title="section.name">
                {{ section.name }}
              </span>
              <ProgressDisk
                v-if="section.tasks.length > 0"
                :value="section.tasks.filter(({ completed }) => completed).length"
                :max="section.tasks.length"
                color="green-accent-2"
                class="ml-1 flex-shrink-0"
                :title="`${
                  section.tasks.filter(({ completed }) => completed).length
                } of ${section.tasks.length} tasks completed`">
              </ProgressDisk>
            </v-tab>
          </v-tabs>

          <v-divider
            :class="{
              'mt-2': taskBySection.length === 1 && taskBySection[0].id === 0,
            }">
          </v-divider>

          <v-tabs-items v-model="sectionTab" touchless class="tab-item-wrapper">
            <v-tab-item v-for="section of taskBySection" :key="`tab-item-${section.id}`">
              <div class="task-wrapper">
                <TaskCard
                  v-for="task of section.tasks.filter(({ completed }) => !completed)"
                  :key="`${section.name}-task-${task.id}`"
                  :task="task"
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
            </v-tab-item>
          </v-tabs-items>
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped lang="scss">
@import 'vuetify/settings';

.project-card {
  min-height: 88px;
  display: flex;
  flex-direction: column;

  .v-card__text {
    flex-grow: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .min-width-0 {
      min-width: 0;
    }
  }
}

.v-tabs :deep(.v-slide-group__prev, .v-slide-group__next) {
  min-width: initial;
  flex-basis: auto;
}

@media #{map-get($display-breakpoints, 'xs')} {
  .v-tabs :deep(.v-tab) {
    font-size: 0.7rem;
    padding: 0 8px;
  }
}

.selected {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  cursor: default;

  & > .project-card {
    height: 100%;

    .v-card__text {
      .section-wrapper {
        flex-grow: 0;
      }

      .tab-item-wrapper {
        flex-grow: 1;
      }

      .task-wrapper {
        overflow-y: auto;
        padding: 12px 0;
        display: grid;
        // auto fit with 260px min size but max 2 column
        grid-template-columns: repeat(auto-fill, minmax(max(260px, calc((100% - 8px) / 2)), 1fr));
        gap: 8px;
      }
    }
  }
}
</style>
