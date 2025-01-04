<script setup lang="ts">
import DailyTaskCard from '@/views/daily/components/DailyTaskCard.vue'
import { DailyTask } from '@/models/daily-task.model'
import moment from 'moment/moment'
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

const display = useDisplay()

const props = defineProps<{
  dailyTaskList: DailyTask[]
  date: string
}>()

const emit = defineEmits<{
  'toggle-daily-task': [dailyTask: DailyTask]
}>()

const numberOfDailyTaskCompleted = computed<number>(
  () => props.dailyTaskList.filter(({ completed }) => completed).length
)
const numberOfDailyTaskUncompleted = computed<number>(
  () => props.dailyTaskList.filter(({ completed }) => !completed).length
)
const taskText = computed<string>(() => {
  if (moment().isSame(props.date, 'day')) {
    if (numberOfDailyTaskUncompleted.value > 0)
      return `You have ${numberOfDailyTaskUncompleted.value} ${
        numberOfDailyTaskUncompleted.value > 1 ? 'tasks' : 'task'
      } left to do today!`
    else return 'All tasks done for today! :)'
  } else {
    if (numberOfDailyTaskCompleted.value === props.dailyTaskList.length)
      return 'All tasks completed for that day! :)'
    else if (numberOfDailyTaskCompleted.value > 0)
      return `${numberOfDailyTaskCompleted.value} on ${props.dailyTaskList.length} tasks were completed that day`
    else return 'No tasks completed that day :('
  }
})

function toggleDailyTask(dailyTask: DailyTask): void {
  emit('toggle-daily-task', dailyTask)
}
</script>

<template>
  <div>
    <h4 class="text-h5 text-lg-h4">
      Tasks
      <v-chip size="small" color="grey-darken-3">
        {{ numberOfDailyTaskCompleted }}
        /
        {{ dailyTaskList.length }}
      </v-chip>
    </h4>
    <p class="text-subtitle-1 text-grey-lighten-1">
      {{ taskText }}
    </p>

    <v-timeline density="compact">
      <v-timeline-item
        v-for="dailyTask in dailyTaskList"
        :key="`daily-task-${dailyTask.id}`"
        fill-dot
        :size="display.xs ? 'small' : 'default'"
        :dot-color="dailyTask.completed ? 'green darken-2' : null">
        <template #icon>
          <div v-ripple class="icon-wrapper" @click="toggleDailyTask(dailyTask)">
            <v-icon v-if="dailyTask.completed" :size="display.xs ? 'small' : 'default'">
              mdi-check
            </v-icon>
            <v-icon v-else :size="display.xs ? 'small' : 'default'">mdi-trophy</v-icon>
          </div>
        </template>
        <DailyTaskCard :daily-task="dailyTask" @toggle="toggleDailyTask(dailyTask)">
        </DailyTaskCard>
      </v-timeline-item>
    </v-timeline>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.v-timeline {
  padding-top: 0;

  --bar-left: 48px;
  --divider-width: 96px;
  --divider-justify-content: center;

  @media #{map.get(variables.$display-breakpoints, 'xs')} {
    --bar-left: 11px;
    --divider-width: 40px;
    --divider-justify-content: flex-start;
  }

  @media #{map.get(variables.$display-breakpoints, 'sm')} {
    --bar-left: 18px;
    --divider-width: 55px;
    --divider-justify-content: flex-start;
  }

  &::before {
    top: 36px;
    left: var(--bar-left) !important;
    height: calc(100% - 60px);
  }

  .v-timeline-item {
    @media #{map.get(variables.$display-breakpoints, 'xs')} {
      padding-bottom: 16px;
    }

    &:last-child {
      padding-bottom: 0;
    }

    & :deep(.v-timeline-item__body) {
      max-width: calc(100% - var(--divider-width));
    }

    & :deep(.v-timeline-item__divider) {
      min-width: var(--divider-width);
      justify-content: var(--divider-justify-content);
    }
  }

  .icon-wrapper {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
