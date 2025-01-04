<script setup lang="ts">
import { DailyTask } from '@/models/daily-task.model'
import { EventModel } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import { sortEvents } from '@/utils/event.utils'
import moment from 'moment'
import DailyDetailTaskTimeline from '@/views/daily/daily-summary/components/DailyDetailTaskTimeline.vue'
import DailyDetailEventTimeline from '@/views/daily/daily-summary/components/DailyDetailEventTimeline.vue'
import { hideScroll, showScroll } from '@/utils/document.utils'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { computed, ref, watch } from 'vue'
import { dailyTaskApi, eventApi } from '@/api'
import { useDisplay } from 'vuetify'

const display = useDisplay()

const show = defineModel<boolean>()

const props = defineProps<{
  date: string
}>()

const emit = defineEmits<{
  'daily-task-completed': [date: string, numberOfDailyTaskCompleted: number]
}>()

const dialogState = ref(false)
const dailyTaskList = ref<DailyTask[]>([])
const events = ref<EventModel[]>([])

const tab = ref<'task' | 'event'>('task')
const isScrollingOnContent = ref(false)

const numberOfDailyTaskCompleted = computed<number>(
  () => dailyTaskList.value.filter(({ completed }) => completed).length
)
const isToday = computed<boolean>(() => moment().isSame(props.date, 'day'))
const editBtnSize = computed<'large' | 'small' | 'default'>(() => {
  if (display.smAndUp) return 'large'
  else if (display.xs) return 'small'
  else return 'default'
})

watch(
  () => props.value,
  (value: boolean): void => {
    dialogState.value = value
    tab.value = 'task'

    if (value) hideScroll()
    else showScroll()
  }
)

watch(
  () => props.date,
  () => {
    retrieveDailyTaskList()
    retrieveTodayEvents()
  },
  { immediate: true }
)

function retrieveDailyTaskList(): void {
  dailyTaskApi.getDailyTasksByDate(props.date).then(
    response => (dailyTaskList.value = response.content),
    error => console.error(error)
  )
}

function retrieveTodayEvents(): void {
  eventApi.getEvents({ date: props.date }).then(
    response =>
      (events.value = response.sort((a: EventModel, b: EventModel) =>
        sortEvents(a, b, { handlePassedEvent: true })
      )),
    error => console.error(error)
  )
}

function touchStartEvent(): void {
  // We detect if the touch-down is a scroll on the content
  const scrollableElement = document.querySelector('.v-dialog')
  if (!scrollableElement) return

  isScrollingOnContent.value = scrollableElement.scrollTop > 0
}

function scrollDownEvent(): void {
  if (!isScrollingOnContent.value) setDialogStateTo(false)
}

function switchTab(direction: 'right' | 'left'): void {
  if (!display.mdAndDown || dailyTaskList.value.length === 0 || events.value.length === 0) return

  if (direction === 'right') tab.value = 'task'
  else if (direction === 'left') tab.value = 'event'
}

function setDialogStateTo(value: boolean): void {
  dialogState.value = value
  show.value = value
}

function toggleDailyTask(dailyTask: DailyTask): void {
  dailyTaskApi.updateDailyTask(dailyTask.id, { completed: !dailyTask.completed }).then(
    response => {
      dailyTask.completed = response.completed // TODO : unused ??
      emitDailyTaskCompletedEvent()
    },
    error => console.error(error)
  )
}

function emitDailyTaskCompletedEvent(): void {
  emit('daily-task-completed', props.date, numberOfDailyTaskCompleted.value)
}
</script>

<template>
  <v-dialog
    :model-value="dialogState"
    fullscreen
    :scrim="false"
    content-class="daily-detail-dialog"
    transition="dialog-bottom-transition"
    @update:model-value="setDialogStateTo($event)">
    <div
      v-touch="{
        start: touchStartEvent,
        left: () => switchTab('left'),
        right: () => switchTab('right'),
        down: scrollDownEvent,
      }"
      class="content pa-4 pa-sm-6 pt-6 pt-sm-8 pt-md-12 pr-8">
      <div class="actions-wrapper">
        <v-btn icon @click="setDialogStateTo(false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="d-flex align-center gap-2 mb-2 mb-sm-3 mb-md-5 mb-lg-10">
        <h1 class="text-h4 text-sm-h3 text-md-h2">
          {{ dateFormat(date, 'dddd DD MMMM Y') }}
        </h1>
        <v-hover v-if="isToday" v-slot="{ hover }">
          <v-btn
            :to="{ name: 'daily-update', params: { date, step: 'task' } }"
            icon
            :size="editBtnSize"
            :color="hover ? 'grey lighten-1' : 'grey darken-3'"
            class="ml-1"
            title="Edit day">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </v-hover>
      </div>

      <template v-if="dailyTaskList.length === 0 && events.length === 0">
        <EmptyListDisplay
          message="No tasks or events are set on for that day."
          class="empty-list-display">
          <template #img>
            <img
              src="../../../../assets/empty-daily-detail.svg"
              alt="empty daily detail"
              class="empty-list-display__img" />
          </template>
        </EmptyListDisplay>
      </template>

      <template v-if="display.mdAndDown">
        <template v-if="dailyTaskList.length > 0 && events.length > 0">
          <!-- Tabs -->
          <v-tabs v-model="tab" bg-color="transparent" color="accent" grow class="flex-grow-0">
            <v-tab tab-value="task">Tasks</v-tab>
            <v-tab tab-value="event">Events</v-tab>
          </v-tabs>

          <v-tabs-items v-model="tab" touchless class="bg-transparent py-2 pa-sm-2 pa-md-4">
            <v-tab-item value="task">
              <DailyDetailTaskTimeline
                :daily-task-list="dailyTaskList"
                :date
                @toggle-daily-task="toggleDailyTask($event)" />
            </v-tab-item>
            <v-tab-item value="event">
              <DailyDetailEventTimeline :events :date />
            </v-tab-item>
          </v-tabs-items>
        </template>
        <template v-else-if="dailyTaskList.length > 0">
          <!-- Only tasks -->
          <div class="overflow-auto">
            <DailyDetailTaskTimeline
              :daily-task-list="dailyTaskList"
              :date
              @toggle-daily-task="toggleDailyTask($event)" />
          </div>
        </template>
        <template v-else-if="events.length > 0">
          <!-- Only events -->
          <DailyDetailEventTimeline :events :date />
        </template>
      </template>
      <template v-else>
        <template v-if="dailyTaskList.length > 0 || events.length > 0">
          <!-- Tasks and events -->
          <v-row class="pl-4">
            <v-col v-if="dailyTaskList.length > 0" :cols="events.length > 0 ? 7 : 8">
              <DailyDetailTaskTimeline
                :daily-task-list="dailyTaskList"
                :date
                @toggle-daily-task="toggleDailyTask($event)" />
            </v-col>

            <v-col v-if="events.length > 0" :cols="dailyTaskList.length > 0 ? 5 : 8">
              <DailyDetailEventTimeline :events :date />
            </v-col>
          </v-row>
        </template>
      </template>
    </div>
  </v-dialog>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.actions-wrapper {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  padding: 1rem;

  @media #{map.get(variables.$display-breakpoints, 'xs')} {
    padding: 0.5rem;
  }
}

.empty-list-display {
  flex-grow: 1;

  &__img {
    width: clamp(200px, 25%, 400px);
  }
}
</style>
