<script setup lang="ts">
import { dateFormat } from '@/pipes'
import { DailySummary } from '@/models/daily-summary.model'
import TaskCounter from '@/components/TaskCounter.vue'
import { computed } from 'vue'

const props = defineProps<{
  dailySummary: DailySummary
}>()

const emit = defineEmits<{
  'open-daily-detail': []
}>()

// todo : Define colorArray
const colorOfTaskCompleted = computed<string>(() => {
  const colorArray = ['#163317', 'green-darken-4', 'green-darken-3', 'green-darken-2', 'green']
  const index =
    Math.trunc(
      (props.dailySummary.totalTaskCompleted * colorArray.length) / props.dailySummary.totalTask
    ) - 1
  return colorArray[index]
})

const backgroundColor = computed<string | undefined>(() => {
  if (!props.dailySummary.totalTask && !props.dailySummary.totalEvent) return '#151515'
  else if (!props.dailySummary.totalTaskCompleted) return undefined

  return colorOfTaskCompleted.value
})

function openDailyDetailDialog(): void {
  emit('open-daily-detail')
}
</script>

<template>
  <v-card
    :color="backgroundColor"
    :ripple="false"
    class="rounded-lg"
    v-on="
      dailySummary.totalTask || dailySummary.totalEvent
        ? { click: () => openDailyDetailDialog() }
        : {}
    ">
    <v-card-text class="daily-summary-card d-flex flex-row">
      <div class="flex-grow-1">
        <h1 class="text-headline-small font-weight-medium text-white mb-0">
          {{ dateFormat(dailySummary.date, 'dddd') }}
        </h1>
        <p class="text-title-small text-md-body-large mb-0">
          {{ dateFormat(dailySummary.date, 'DD MMMM Y') }}
        </p>
      </div>

      <div
        class="d-flex flex-column align-end"
        :class="{ 'justify-end': dailySummary.totalTask === 0 }">
        <TaskCounter
          v-if="dailySummary.totalTask"
          :value="dailySummary.totalTaskCompleted"
          :max="dailySummary.totalTask"
          class="flex-shrink-0 mb-2" />

        <div v-if="dailySummary.totalEvent > 0" class="flex-shrink-0 d-flex gap-1">
          <span class="daily-event">{{ dailySummary.totalEvent }}</span>
          <v-icon icon="mdi-calendar-clock" size="large" />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use '@/styles/breakpoints' as variables;

.daily-summary-card {
  min-height: 96px;

  .daily-event {
    font-size: 1.5rem;
    line-height: 1;
    color: white;

    @media #{map.get(variables.$display-breakpoints, 'sm-and-down')} {
      font-size: 1.25rem;
    }
  }
}
</style>
