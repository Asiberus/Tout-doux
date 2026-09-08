<script setup lang="ts">
import { DailyTask, DailyTaskDraft } from '@/models/daily-task.model'
import { EventExtendedModel } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import { sortEvents } from '@/utils/event.utils'
import DailyDetailTaskTimeline from '@/views/daily/daily-summary/components/DailyDetailTaskTimeline.vue'
import DailyDetailEventTimeline from '@/views/daily/daily-summary/components/DailyDetailEventTimeline.vue'
import { hideScroll, showScroll } from '@/utils/document.utils'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { MAX_PLANNING_HORIZON_DAYS } from '@/utils/constants'
import moment from 'moment'
import { computed, ref, watch } from 'vue'
import { dailyTaskApi, eventApi } from '@/api'
import { useDisplay } from 'vuetify'

const { xs, smAndUp, mdAndDown } = useDisplay()

const show = defineModel<boolean>()

const props = defineProps<{
  date: string
}>()

const emit = defineEmits<{
  'daily-task-completed': [date: string, numberOfDailyTaskCompleted: number]
  'daily-task-created': [date: string]
  navigate: [date: string]
}>()

const dialogState = ref(false)
const dailyTaskList = ref<DailyTask[]>([])
const events = ref<EventExtendedModel[]>([])

const tab = ref<'task' | 'event'>('task')
const isScrollingOnContent = ref(false)

const numberOfDailyTaskCompleted = computed<number>(
  () => dailyTaskList.value.filter(({ completed }) => completed).length
)
// Pas de borne vers l'arrière : un jour passé sans rien affiche simplement l'état vide.
const isToday = computed<boolean>(() => moment().isSame(props.date, 'day'))
const isPassed = computed<boolean>(() => moment(props.date).isBefore(moment(), 'day'))
const canGoForward = computed<boolean>(
  () => moment(props.date).diff(moment().startOf('day'), 'days') < MAX_PLANNING_HORIZON_DAYS
)
const actionBtnSize = computed<'large' | 'small' | 'default'>(() => {
  if (smAndUp.value) return 'large'
  else if (xs.value) return 'default'
  else return 'default'
})

watch(show, value => {
  dialogState.value = !!value
  tab.value = 'task'

  if (value) hideScroll()
  else showScroll()
})

watch(
  () => props.date,
  () => {
    retrieveDailyTaskList()
    retrieveTodayEvents()
  }
  // TODO (vue3) : see if immediate was needed
  // { immediate: false }
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
      (events.value = response.sort((a: EventExtendedModel, b: EventExtendedModel) =>
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
  if (!mdAndDown.value || dailyTaskList.value.length === 0 || events.value.length === 0) return

  if (direction === 'right') tab.value = 'task'
  else if (direction === 'left') tab.value = 'event'
}

function shiftDay(offset: number): void {
  emit('navigate', moment(props.date).add(offset, 'day').format('YYYY-MM-DD'))
}

function goToToday(): void {
  emit('navigate', moment().format('YYYY-MM-DD'))
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

function createDailyTask(data: DailyTaskDraft): void {
  dailyTaskApi.createDailyTask({ ...data, date: props.date }).then(
    response => {
      dailyTaskList.value.push(response)
      emit('daily-task-created', props.date)
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
      class="content pa-4 pa-sm-6 pt-6 pt-sm-8 pt-md-12 pr-4 pr-sm-6 pr-md-8">
      <div class="actions-wrapper">
        <v-btn icon variant="text" density="comfortable" @click="setDialogStateTo(false)">
          <v-icon icon="mdi-close" />
        </v-btn>
      </div>

      <div
        class="d-flex flex-column flex-sm-row align-center flex-wrap gap-1 mb-2 mb-sm-3 mb-md-5 mb-lg-10">
        <h1
          class="text-headline-large text-sm-display-medium text-md-display-large text-center text-sm-start">
          {{ dateFormat(date, 'dddd DD MMMM Y') }}
        </h1>

        <div class="d-flex align-center gap-2 ml-0 ml-sm-auto">
          <v-btn
            v-if="xs || !isToday"
            icon
            :disabled="xs && isToday"
            variant="text"
            density="comfortable"
            class="today-btn"
            :size="actionBtnSize"
            title="Today"
            @click="goToToday()">
            <v-icon icon="mdi-calendar-heart" />
          </v-btn>
          <v-btn
            icon
            variant="text"
            density="comfortable"
            :size="actionBtnSize"
            title="Previous day"
            class="previous-day-btn"
            @click="shiftDay(-1)">
            <v-icon icon="mdi-calendar-end" />
          </v-btn>
          <v-btn
            icon
            variant="text"
            density="comfortable"
            :size="actionBtnSize"
            :disabled="!canGoForward"
            title="Next day"
            class="next-day-btn"
            @click="shiftDay(1)">
            <v-icon icon="mdi-calendar-end" />
          </v-btn>

          <v-btn
            :to="{ name: 'daily-update', params: { date, step: 'task' } }"
            :disabled="isPassed"
            icon
            variant="text"
            density="comfortable"
            :size="actionBtnSize"
            title="Edit day"
            class="edit-btn">
            <v-icon icon="mdi-pencil" />
          </v-btn>
        </div>
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
          <template v-if="!isPassed" #action>
            <v-btn>
              <v-icon icon="mdi-calendar-edit" start />
              Prepare the day
            </v-btn>
          </template>
        </EmptyListDisplay>
      </template>

      <template v-if="mdAndDown">
        <template v-if="dailyTaskList.length > 0 && events.length > 0">
          <!-- Stepper (même composant que DailyUpdate.vue) -->
          <v-stepper
            v-model="tab"
            non-linear
            alt-labels
            mobile-breakpoint="lg"
            class="daily-detail-stepper flex-grow-0">
            <v-stepper-header>
              <v-divider />
              <v-stepper-item
                value="task"
                editable
                :color="tab === 'task' ? 'accent' : 'stepperInactive'"
                icon="mdi-trophy"
                edit-icon="mdi-trophy">
                <template #title>Tasks</template>
              </v-stepper-item>
              <v-divider />
              <v-stepper-item
                value="event"
                editable
                :color="tab === 'event' ? 'accent' : 'stepperInactive'"
                icon="mdi-calendar-clock"
                edit-icon="mdi-calendar-clock">
                <template #title>Events</template>
              </v-stepper-item>
              <v-divider />
            </v-stepper-header>
          </v-stepper>

          <v-tabs-window v-model="tab" :touch="false" class="bg-transparent py-2 pa-sm-2 pa-md-4">
            <v-tabs-window-item value="task">
              <DailyDetailTaskTimeline
                :daily-task-list="dailyTaskList"
                :date
                @toggle-daily-task="toggleDailyTask($event)"
                @create-daily-task="createDailyTask($event)" />
            </v-tabs-window-item>
            <v-tabs-window-item value="event">
              <DailyDetailEventTimeline :events :date />
            </v-tabs-window-item>
          </v-tabs-window>
        </template>
        <template v-else-if="dailyTaskList.length > 0">
          <!-- Only tasks -->
          <div class="overflow-auto">
            <DailyDetailTaskTimeline
              :daily-task-list="dailyTaskList"
              :date
              @toggle-daily-task="toggleDailyTask($event)"
              @create-daily-task="createDailyTask($event)" />
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
                @toggle-daily-task="toggleDailyTask($event)"
                @create-daily-task="createDailyTask($event)" />
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
@use '@/styles/breakpoints' as variables;

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

// Dupliqué depuis DailyUpdate.vue, qui a le même en-tête de navigation. À la troisième
// occurrence, monter la règle dans global.scss.
.previous-day-btn .v-icon {
  transform: scaleX(-1);
}

.actions-group {
  @media #{map.get(variables.$display-breakpoints, 'xs')} {
    margin-left: 0;
  }
}

.empty-list-display {
  flex-grow: 1;

  &__img {
    width: clamp(200px, 25%, 300px);
  }
}

// Dupliqué depuis DailyUpdate.vue (2ᵉ occurrence, cf. règle .previous-day-btn plus haut) : à la
// prochaine, monter dans global.scss.
.daily-detail-stepper {
  box-shadow: none !important;
  background: transparent !important;
  border: none !important;

  --stepper-avatar-size: 35px;
  --stepper-icon-size: 18px;

  :deep(.v-stepper-item__avatar.v-avatar) {
    width: var(--stepper-avatar-size) !important;
    height: var(--stepper-avatar-size) !important;

    .v-icon {
      font-size: var(--stepper-icon-size);
    }
  }

  :deep(.v-stepper-header) {
    box-shadow: none !important;
    margin-bottom: 4px;

    .v-divider:first-child {
      margin-inline-start: 0;
    }

    .v-divider:last-child {
      margin-inline-end: 0;
    }
  }

  :deep(.v-stepper-item) {
    border-radius: 8px;
  }

  @media #{map.get(variables.$display-breakpoints, 'xs')} {
    :deep(.v-stepper-item) {
      padding: 8px;
      flex: 1 1 0;
      border-radius: 8px;
    }

    :deep(.v-stepper-item__avatar.v-avatar) {
      margin-bottom: 0;
    }

    :deep(.v-stepper-header) {
      .v-divider {
        display: none;
      }

      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: rgba(var(--v-border-color), var(--v-border-opacity));
      }
    }
  }
}
</style>
