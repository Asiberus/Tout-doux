<script setup lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import ProgressWheel from '@/components/ProgressWheel.vue'
import { ProjectDetail } from '@/models/project.model'
import { Task, TaskPatch, TaskPost } from '@/models/task.model'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import TaskCard from '@/views/components/task/TaskCard.vue'
import TagGroup from '@/views/components/tag/TagGroup.vue'
import { getDialogWidth } from '@/utils/dialog.utils'
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useDisplay } from 'vuetify'
import { usePreferencesStore, useProjectStore } from '@/store'
import { dateFormat } from '@/pipes'

const display = useDisplay()
const projectStore = useProjectStore()
const preferencesStore = usePreferencesStore()

const descriptionElement = useTemplateRef('description')

onMounted(() => {
  if (display.xs)
    isDescriptionOverflowing.value =
      descriptionElement.value.scrollHeight > descriptionElement.value.clientHeight
})

const taskDialog = ref(false)
const displayCompletedTask = ref(false)

const displayDescription = ref(false)
const isDescriptionOverflowing = ref(false)

const project = computed<ProjectDetail>(() => projectStore.currentProject)
const uncompletedTasks = computed<Task[]>(() =>
  project.value.tasks.filter(({ completed }) => !completed)
)
const completedTasks = computed<Task[]>(() =>
  project.value.tasks.filter(({ completed }) => completed)
)
const allTasks = computed<Task[]>(() =>
  project.value.tasks.concat(...project.value.sections.map(({ tasks }) => tasks))
)
const allCompletedTasks = computed<Task[]>(() =>
  allTasks.value.filter(({ completed }) => completed)
)
const progressWheelSize = computed<'x-small' | 'small' | 'medium' | 'large' | 'x-large'>(() => {
  if (display.xs) return 'x-small'
  if (display.smAndDown) return 'small'
  else if (display.mdAndDown) return 'medium'
  else if (display.lgAndDown) return 'large'
  else return 'x-large'
})

function createTask(task: TaskPost): void {
  taskDialog.value = false
  task.projectId = project.value.id
  projectStore.addTask(task)
}

function toggleTaskState(id: number, completed: boolean): void {
  projectStore.editTask(id, { completed })
}

function updateTask(id: number, data: TaskPatch): void {
  projectStore.editTask(id, data)
}

function deleteTask(id: number): void {
  projectStore.deleteTask(id)
}
</script>

<template>
  <div class="flex-grow-1 d-flex flex-column">
    <div class="project-description">
      <div class="project-description__description">
        <h3 class="text-h6 text-sm-h5 mb-1 mb-lg-2">Description</h3>
        <v-card class="rounded-lg mb-3">
          <v-card-text>
            <div
              ref="description"
              class="project-description__description__content text-body-2"
              :class="{
                'display-description': displayDescription,
                'cursor-pointer': isDescriptionOverflowing,
              }"
              @click="displayDescription = !displayDescription">
              {{ project.description }}
            </div>
            <div class="d-flex justify-end align-center mt-1" title="Created on">
              <v-icon size="small">mdi-clock</v-icon>
              <span class="font-italic ml-1">{{ dateFormat(project.createdOn, 'D MMMM Y') }}</span>
            </div>
          </v-card-text>
        </v-card>
        <template v-if="project.tags.length > 0">
          <TagGroup
            :tag-list="project.tags"
            :max-tag="10"
            :large="true"
            :icon-transparent="false"
            :auto-shrink="false"
            :multi-row="true" />
        </template>
      </div>
      <div class="project-description__progress-wheel">
        <ProgressWheel
          :size="progressWheelSize"
          :mode="preferencesStore.preferences.progressWheelMode"
          :value="allCompletedTasks.length"
          :max="allTasks.length"
          color="green-accent-2" />
      </div>
    </div>

    <div class="d-flex flex-column flex-sm-row column-gap-2 row-gap-1 mt-5 mt-md-10 mb-2">
      <div class="d-flex align-center flex-grow-1">
        <h3 class="text-h6 text-sm-h5 flex-grow-1">General Tasks</h3>

        <template v-if="display.xs && project.tasks.length === 0">
          <v-dialog v-model="taskDialog" :width="getDialogWidth()" :fullscreen="display.smAndDown">
            <template #activator="{ props }">
              <v-btn :disabled="project.archived" v-bind="props">
                <v-icon start>mdi-plus</v-icon>
                task
              </v-btn>
            </template>
            <TaskDialog
              :is-dialog-open="taskDialog"
              @create="createTask"
              @close="taskDialog = false" />
          </v-dialog>
        </template>
      </div>

      <div class="d-flex justify-space-between align-center gap-2">
        <FilterChip
          v-if="project.tasks.length > 0"
          v-model="displayCompletedTask"
          color="green-darken-2"
          icon="mdi-trophy"
          class="flex-shrink-0">
          Completed
        </FilterChip>

        <template v-if="display.smAndUp || project.tasks.length > 0">
          <v-dialog v-model="taskDialog" :width="getDialogWidth()" :fullscreen="display.smAndDown">
            <template #activator="{ props }">
              <v-btn
                :disabled="project.archived"
                :block="display.xs && project.tasks.length === 0 && false"
                v-bind="props">
                <v-icon start>mdi-plus</v-icon>
                task
              </v-btn>
            </template>
            <TaskDialog
              :is-dialog-open="taskDialog"
              @create="createTask"
              @close="taskDialog = false">
            </TaskDialog>
          </v-dialog>
        </template>
      </div>
    </div>

    <template v-if="!displayCompletedTask">
      <template v-if="uncompletedTasks.length > 0">
        <div class="task-wrapper">
          <TaskCard
            v-for="task of uncompletedTasks"
            :key="task.id"
            :task="task"
            :disabled="project.archived"
            @toggle-state="toggleTaskState"
            @update="updateTask"
            @delete="deleteTask" />
        </div>
      </template>
      <template
        v-else-if="project.tasks.length > 0 && project.tasks.length === completedTasks.length">
        <EmptyListDisplay
          message="You completed all the general tasks of this project!"
          class="empty-list-display">
          <template #img>
            <img
              src="../../../../assets/all_task_completed.svg"
              alt="All tasks completed"
              class="empty-list-display__img" />
          </template>
        </EmptyListDisplay>
      </template>
      <template v-else>
        <EmptyListDisplay message="This project has no general task." class="empty-list-display">
          <template #img>
            <img
              src="../../../../assets/project-no-tasks.svg"
              alt="No tasks"
              class="empty-list-display__img" />
          </template>
        </EmptyListDisplay>
      </template>
    </template>
    <template v-else>
      <template v-if="completedTasks.length > 0">
        <div class="task-wrapper">
          <TaskCard
            v-for="task of completedTasks"
            :key="task.id"
            :task="task"
            :disabled="project.archived"
            @toggle-state="toggleTaskState"
            @update="updateTask"
            @delete="deleteTask" />
        </div>
      </template>
      <template v-else>
        <EmptyListDisplay
          message="You didn't completed any general tasks yet!"
          class="empty-list-display">
          <template #img>
            <img
              src="../../../../assets/project-no-tasks.svg"
              alt="No tasks completed"
              class="empty-list-display__img" />
          </template>
        </EmptyListDisplay>
      </template>
    </template>
  </div>
</template>

<style scoped lang="scss">
@import 'vuetify/settings';

.project-description {
  display: flex;
  flex-wrap: wrap-reverse;
  column-gap: 20px;
  row-gap: 8px;

  &__description {
    flex: 1 1 calc(75% - 20px);
    max-width: 100%;

    @media #{map-get($display-breakpoints, 'xs')} {
      &__content {
        max-height: calc(4.6 * 1.25rem); // Equal to 4.6 row
        transition: all 0.3s ease-out;

        &.display-description {
          height: fit-content;
          max-height: 500px;
        }

        &:not(.display-description) {
          text-overflow: ellipsis;
          overflow: hidden;
        }
      }
    }
  }

  &__progress-wheel {
    flex: 2 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.task-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(max(290px, calc((100% - 8px) / 2)), 1fr));
  gap: 8px;
}

.empty-list-display {
  flex-grow: 1;
  padding: 20px;

  &__img {
    width: clamp(200px, 50%, 300px);

    @media #{map-get($display-breakpoints, 'xl')} {
      width: clamp(200px, 50%, 450px);
    }
  }
}
</style>
