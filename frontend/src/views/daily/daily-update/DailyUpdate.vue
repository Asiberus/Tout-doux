<script setup lang="ts">
import { dateFormat } from '@/pipes'
import DailyUpdateEvent from '@/views/daily/daily-update/steps/event/DailyUpdateEvent.vue'
import DailyUpdateTask from '@/views/daily/daily-update/steps/task/DailyUpdateTask.vue'
import SecondaryTitle from '@/components/SecondaryTitle.vue'
import { onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps<{
  date: string
  step: 'task' | 'event'
}>()

onBeforeMount(() => {
  if (props.step === 'task') dailyStepper.value = 1
  else if (props.step === 'event') dailyStepper.value = 2
})

const dailyStepper = ref(1)
const dailyTaskCount = ref(0)
const dailyEventCount = ref(0)

function goToDailyDetail(): void {
  router.push({ name: 'daily-summary', params: { date: props.date } })
}

function onStepperChange(index: number): void {
  const step = index === 1 ? 'task' : 'event'
  router.replace({ params: { step } })
}
</script>

<template>
  <div class="daily-update">
    <div class="d-flex flex-column flex-sm-row justify-space-between align-center gap-2 mb-2">
      <SecondaryTitle class="text-center text-sm-start">
        <span class="text-grey">Daily : </span>{{ dateFormat(date, 'dddd DD MMMM Y') }}
      </SecondaryTitle>

      <v-btn
        :disabled="dailyTaskCount === 0 && dailyEventCount === 0"
        color="accent"
        rounded
        @click="goToDailyDetail()">
        Start the day
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </div>

    <v-stepper
      :value="dailyStepper"
      non-linear
      alt-labels
      class="daily-update-stepper"
      @change="onStepperChange($event)">
      <v-stepper-header>
        <v-divider />
        <v-stepper-step :step="1" editable color="accent">
          Task
          <template v-if="dailyTaskCount > 0">({{ dailyTaskCount }})</template>
        </v-stepper-step>
        <v-divider />
        <v-stepper-step :step="2" editable color="accent">
          Event
          <template v-if="dailyEventCount > 0">({{ dailyEventCount }})</template>
        </v-stepper-step>
        <v-divider />
      </v-stepper-header>
      <v-stepper-items>
        <v-stepper-content :step="1">
          <DailyUpdateTask :date @daily-task-count="dailyTaskCount = $event" />
        </v-stepper-content>
        <v-stepper-content :step="2">
          <DailyUpdateEvent :date @daily-event-count="dailyEventCount = $event" />
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.daily-update {
  height: 100%;
  display: flex;
  flex-direction: column;

  @media #{map.get(variables.$display-breakpoints, 'sm-and-down')} {
    .v-stepper__step--editable:hover {
      background: inherit;
    }
  }
}
</style>
