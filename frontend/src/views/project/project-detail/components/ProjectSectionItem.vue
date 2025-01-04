<script setup lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import ProgressWheel from '@/components/ProgressWheel.vue'
import { SectionPatch, SectionTask } from '@/models/section.model'
import { Task, TaskPatch, TaskPost } from '@/models/task.model'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import TaskCard from '@/views/components/task/TaskCard.vue'
import SectionDialog from '@/views/project/project-detail/components/SectionDialog.vue'
import { getDialogWidth } from '@/utils/dialog.utils'
import { computed, ref } from 'vue'
import { usePreferencesStore, useProjectStore } from '@/store'
import { useDisplay } from 'vuetify'

const display = useDisplay()
const projectStore = useProjectStore()
const preferencesStore = usePreferencesStore()

const props = defineProps<{
  section: SectionTask
  disabled: boolean
}>()

defineEmits<{
  'new-section': []
}>()

const taskDialog = ref(false)
const sectionDialog = ref(false)
const displayCompletedTask = ref(false)

const completedTasks = computed<Task[]>(() =>
  props.section.tasks.filter(({ completed }) => completed)
)

const uncompletedTasks = computed<Task[]>(() =>
  props.section.tasks.filter(({ completed }) => !completed)
)

const completedTasksPercentage = computed<number>(() => {
  if (props.section.tasks.length === 0) return 0
  return Math.round((completedTasks.value.length / props.section.tasks.length) * 100)
})

const progressWheelSize = computed<'x-small' | 'small' | 'medium' | 'large'>(() => {
  if (display.smAndDown) return 'x-small'
  else if (display.mdAndDown) return 'small'
  else if (display.lgAndDown) return 'medium'
  else return 'large'
})

function updateSection({ name }: SectionPatch): void {
  sectionDialog.value = false
  projectStore.editSection(props.section.id, name)
}

function deleteSection(): void {
  sectionDialog.value = false
  projectStore.deleteSection(props.section.id)
}

function createTask(task: TaskPost): void {
  taskDialog.value = false
  task.sectionId = props.section.id
  projectStore.addTask(task)
}

// TODO : test it
function toggleTaskState(id: number, completed: boolean): void {
  projectStore.editTask(id, { completed }, props.section.id)
}

function updateTask(id: number, data: TaskPatch): void {
  projectStore.editTask(id, data, props.section.id)
}

function deleteTask(id: number): void {
  projectStore.deleteTask(id, props.section.id)
}
</script>

<template>
  <div>
    <v-btn
      v-if="display.xs"
      :disabled="disabled"
      size="small"
      class="mb-1"
      @click="$emit('new-section')">
      <v-icon start>mdi-plus</v-icon>
      section
    </v-btn>
    <div class="d-flex align-center justify-ends gap-2 mb-2">
      <h3 class="section-title text-h6">
        {{ section.name }}

        <v-dialog v-model="sectionDialog" :width="getDialogWidth()" :fullscreen="display.smAndDown">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              :disabled
              :size="display.mdAndDown ? 'small' : 'default'"
              icon>
              <v-icon size="small">mdi-pencil</v-icon>
            </v-btn>
          </template>
          <SectionDialog
            :section="section"
            :is-dialog-open="sectionDialog"
            @submit="updateSection"
            @delete="deleteSection"
            @close="sectionDialog = false" />
        </v-dialog>
      </h3>

      <v-btn
        v-if="display.smAndUp"
        :disabled="disabled"
        :size="display.mdAndDown || true ? 'small' : 'default'"
        @click="$emit('new-section')">
        <v-icon start>mdi-plus</v-icon>
        section
      </v-btn>
    </div>

    <v-row class="flex-wrap-reverse flex-sm-nowrap" :no-gutters="display.xs">
      <v-col :cols="display.smAndUp ? 9 : 12">
        <div class="d-flex align-center mb-2">
          <FilterChip
            v-if="section.tasks.length > 0"
            v-model="displayCompletedTask"
            color="green-darken-2"
            icon="mdi-trophy">
            Completed
          </FilterChip>

          <v-spacer />

          <v-dialog v-model="taskDialog" :width="getDialogWidth()" :fullscreen="display.smAndDown">
            <template #activator="{ props: menuProps }">
              <v-btn v-bind="menuProps" :disabled :size="display.smAndDown ? 'small' : 'default'">
                <v-icon start>mdi-plus</v-icon>
                task
              </v-btn>
            </template>
            <TaskDialog
              :is-dialog-open="taskDialog"
              @create="createTask"
              @close="taskDialog = false" />
          </v-dialog>
        </div>

        <template v-if="!displayCompletedTask">
          <template v-if="uncompletedTasks.length > 0">
            <TaskCard
              v-for="task of uncompletedTasks"
              :key="task.id"
              :task
              :disabled
              class="mb-2"
              @toggle-state="toggleTaskState"
              @update="updateTask"
              @delete="deleteTask" />
          </template>
          <template
            v-else-if="section.tasks.length > 0 && section.tasks.length === completedTasks.length">
            <EmptyListDisplay message="You completed all the tasks of this section!" class="my-3">
              <template #img>
                <img
                  src="../../../../assets/all_task_completed.svg"
                  alt="All tasks completed!"
                  class="empty-img" />
              </template>
            </EmptyListDisplay>
          </template>
          <template v-else>
            <EmptyListDisplay message="This section has no task yet." class="my-3">
              <template #img>
                <img
                  src="../../../../assets/project-no-tasks.svg"
                  alt="No tasks"
                  class="empty-img" />
              </template>
            </EmptyListDisplay>
          </template>
        </template>
        <template v-else>
          <template v-if="completedTasks.length > 0">
            <TaskCard
              v-for="task of completedTasks"
              :key="task.id"
              :task
              :disabled
              class="mb-2"
              @toggle-state="toggleTaskState"
              @update="updateTask"
              @delete="deleteTask">
            </TaskCard>
          </template>
          <template v-else>
            <EmptyListDisplay message="You didn't completed any tasks yet!" class="my-3">
              <template #img>
                <img
                  src="../../../../assets/project-no-tasks.svg"
                  alt="No tasks completed"
                  class="empty-img" />
              </template>
            </EmptyListDisplay>
          </template>
        </template>
      </v-col>
      <v-col :cols="display.smAndUp ? 3 : 12">
        <v-scale-transition origin="center">
          <div
            v-if="section.tasks.length > 0"
            class="d-flex flex-column align-center justify-center">
            <template v-if="display.smAndUp">
              <ProgressWheel
                :mode="preferencesStore.preferences.progressWheelMode"
                :value="completedTasks.length"
                :max="section.tasks.length"
                :size="progressWheelSize"
                color="green-accent-2">
              </ProgressWheel>
            </template>
            <template v-else>
              <v-progress-linear
                color="green-accent-2"
                :model-value="completedTasksPercentage"
                rounded>
              </v-progress-linear>
              <div>{{ completedTasks.length }} / {{ section.tasks.length }}</div>
            </template>
          </div>
        </v-scale-transition>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.section-title {
  line-height: 1.5rem;
}

.empty-img {
  width: clamp(200px, 50%, 300px);

  @media #{map.get(variables.$display-breakpoints, 'xl')} {
    width: clamp(200px, 50%, 400px);
  }
}
</style>
