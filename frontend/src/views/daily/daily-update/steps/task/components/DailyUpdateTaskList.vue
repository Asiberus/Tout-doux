<script setup lang="ts">
import { DailyTask, DailyTaskPost, DailyUpdateTaskTab } from '@/models/daily-task.model'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import DailyTaskFormCard from '@/views/daily/components/DailyTaskFormCard.vue'
import DailyTaskForm from '@/views/daily/components/DailyTaskForm.vue'
import { ref, watch } from 'vue'

// todo : maybe change v-hover on daily task card

defineProps<{
  dailyTaskList: DailyTask[]
}>()

const emit = defineEmits<{
  create: [data: DailyTaskPost]
  update: [event: { id: number; data: DailyTaskPost }]
  delete: [id: number]
  select: [event: { tab: DailyUpdateTaskTab; id: number; sectionId?: number }]
}>()

const selectedDailyTask = ref<number | null>(null)
const createDailyTaskDisplayed = ref(false)

watch(createDailyTaskDisplayed, (value: boolean) => {
  if (value) selectedDailyTask.value = null
})

watch(selectedDailyTask, (value: number | null) => {
  if (value !== null) createDailyTaskDisplayed.value = false
})

function createDailyTask(data: DailyTaskPost): void {
  createDailyTaskDisplayed.value = false
  emit('create', data)
}

function updateDailyTask(id: number, data: DailyTaskPost): void {
  selectedDailyTask.value = null
  emit('update', { id, data })
}

function deleteDailyTask(id: number): void {
  emit('delete', id)
}

function select(event: { tab: DailyUpdateTaskTab; id: number; sectionId?: number }): void {
  emit('select', event)
}
</script>

<template>
  <div class="d-flex flex-column">
    <div class="d-flex align-center mb-3">
      <h2 class="text-h5 mr-2">Tasks of the day</h2>
      <v-chip v-if="dailyTaskList.length > 0" size="small">
        {{ dailyTaskList.length }}
      </v-chip>
      <v-spacer />
      <v-btn
        icon
        size="small"
        :color="createDailyTaskDisplayed ? 'accent' : null"
        @click="createDailyTaskDisplayed = !createDailyTaskDisplayed">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </div>

    <template v-if="dailyTaskList.length > 0 || createDailyTaskDisplayed">
      <div class="daily-task-wrapper">
        <template v-for="dailyTask of dailyTaskList" :key="dailyTask.id">
          <DailyTaskFormCard
            :daily-task="dailyTask"
            :edit-mode="selectedDailyTask === dailyTask.id"
            @show-edit-mode="selectedDailyTask = dailyTask.id"
            @hide-edit-mode="selectedDailyTask = null"
            @update="updateDailyTask(dailyTask.id, $event)"
            @delete="deleteDailyTask(dailyTask.id)"
            @select="select($event)" />
        </template>
        <template v-if="createDailyTaskDisplayed">
          <v-card class="rounded-lg pa-4">
            <DailyTaskForm
              @submit="createDailyTask($event)"
              @close="createDailyTaskDisplayed = false" />
          </v-card>
        </template>
      </div>
    </template>

    <template v-else>
      <EmptyListDisplay message="You didn't add any task yet!" class="empty-list-display">
        <template #img>
          <img
            src="../../../../../../assets/no_tasks.svg"
            alt="No tasks"
            class="empty-list-display__img" />
        </template>
      </EmptyListDisplay>
    </template>
  </div>
</template>

<style scoped lang="scss">
@import 'vuetify/settings';

.daily-task-wrapper {
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media #{map-get($display-breakpoints, 'md-and-up')} {
    flex: 1 0 0;
  }
}

.empty-list-display {
  flex-grow: 1;

  &__img {
    width: clamp(200px, 50%, 300px);
  }
}
</style>
