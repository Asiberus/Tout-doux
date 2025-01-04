<script setup lang="ts">
import { dateFormat } from '@/pipes'
import { DailySummary } from 'src/models/daily-summary.model'
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
  const colorArray = ['#163317', 'green darken-4', 'green darken-3', 'green darken-2', 'green']
  const index =
    Math.trunc(
      (props.dailySummary.totalTaskCompleted * colorArray.length) / props.dailySummary.totalTask
    ) - 1
  return colorArray[index]
})

const backgroundColor = computed<string | null>(() => {
  if (!props.dailySummary.totalTask && !props.dailySummary.totalEvent) return '#151515'
  else if (!props.dailySummary.totalTaskCompleted) return null

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
        <h1 class="text-h5 font-weight-medium text-white mb-0">
          {{ dateFormat(dailySummary.date, 'dddd') }}
        </h1>
        <p class="text-subtitle-2 text-md-subtitle-1 mb-0">
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
          <v-icon>mdi-calendar-clock</v-icon>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.daily-summary-card {
  min-height: 96px;

  .daily-event {
    font-size: 1.5rem;
    color: white;

    @media #{map.get(variables.$display-breakpoints, 'sm-and-down')} {
      font-size: 1.25rem;
    }
  }
}
</style>
