<script setup lang="ts">
import { EventExtendedModel, EventPostOrPatch } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import { isEventRelatedToDate, sortEvents } from '@/utils/event.utils'
import EventDayDialog from '@/views/components/event/EventDayDialog.vue'
import EventDialog from '@/views/components/event/EventDialog.vue'
import moment from 'moment'
import MainTitle from '@/components/MainTitle.vue'
import { useDialogWidth } from '@/composables/useDialogWidth'
import { computed, onBeforeMount, ref, useTemplateRef } from 'vue'
import { eventApi } from '@/api'
import { useDisplay } from 'vuetify'

const { xs, smAndUp } = useDisplay()
const { dialogWidth, dialogFullscreen } = useDialogWidth()

onBeforeMount(() => {
  retrieveEvents()
})

const calendar = useTemplateRef('calendar')

const events = ref<EventExtendedModel[]>([]) // TODO : think of using Set
const value = ref(moment().format('YYYY-MM-DD'))

const eventDialog = ref(false)
const eventToUpdate = ref<EventExtendedModel>()
const startDatePlaceholder = ref<string>()

const eventDayDialog = ref(false)
const eventDayDialogDate = ref<string | null>(null)
const eventDayDialogEvents = ref<EventExtendedModel[]>([])

let doubleClickTimer: ReturnType<typeof setTimeout> | undefined = undefined

const monthSelected = computed<string>(() => {
  return moment(value.value).format('MMMM YYYY')
})

const isCurrentMonthSelected = computed<boolean>(() => {
  return moment(value.value).isSame(moment(), 'month')
})

function retrieveEvents(): void {
  events.value = []
  const month = moment(value.value).month() + 1 // Month count start at 0
  const year = moment(value.value).year()
  eventApi.getEvents({ month, year }).then(
    response => (events.value = response),
    error => console.error(error)
  )
}

function openEventDialog(
  options: { event?: EventExtendedModel; startDatePlaceholder?: string } = {}
): void {
  eventToUpdate.value = options.event
  startDatePlaceholder.value = options.startDatePlaceholder
  eventDialog.value = true
}

// TODO : See if this can be optimized
function setDayDialogEventList(options: { sort: boolean } = { sort: true }): void {
  if (!eventDayDialogDate.value) return

  eventDayDialogEvents.value = events.value.filter(
    event => isEventRelatedToDate(event, <string>eventDayDialogDate.value) // We have tested that date is not null before
  )
  if (options.sort) eventDayDialogEvents.value.sort((event1, event2) => sortEvents(event1, event2))
}

function createEvent(event: EventPostOrPatch): void {
  eventApi.createEvent(event, { extended: true }).then(
    response => {
      events.value.push(response)
      eventDialog.value = false
      if (eventDayDialog.value) setDayDialogEventList()
    },
    error => console.error(error)
  )
}

function updateEvent({ id, data }: { id: number; data: EventPostOrPatch }): void {
  eventApi.updateEventById(id, data, { extended: true }).then(
    updatedEvent => {
      const eventIndex = events.value.findIndex(e => e.id === id)
      if (eventIndex === -1) return

      events.value.splice(eventIndex, 1, updatedEvent)
      if (eventDayDialog.value) setDayDialogEventList()
      else eventDialog.value = false
    },
    error => console.error(error)
  )
}

function deleteEvent(id: number): void {
  eventApi.deleteEventById(id).then(
    () => {
      const eventIndex = events.value.findIndex(event => event.id === id)
      if (eventIndex === -1) return

      events.value.splice(eventIndex, 1)

      if (eventDayDialog.value) setDayDialogEventList({ sort: false })
      else eventDialog.value = false
    },
    error => console.error(error)
  )
}

function openDayDialog(date: string): void {
  eventDayDialog.value = true
  eventDayDialogDate.value = date
  setDayDialogEventList()
}

function handleClickOnDay(_nativeEvent: Event, day: { date: string }): void {
  const { date } = day
  const delay = 200

  if (doubleClickTimer) {
    clearTimeout(doubleClickTimer)
    doubleClickTimer = undefined
    openEventDialog({ startDatePlaceholder: date })
  } else {
    doubleClickTimer = setTimeout(() => {
      openDayDialog(date)
      doubleClickTimer = undefined
    }, delay)
  }
}

function setCalendarToNow(): void {
  value.value = moment().format('YYYY-MM-DD')
  retrieveEvents()
}

function previousMonth(): void {
  calendar.value?.prev()
  retrieveEvents()
}

function nextMonth(): void {
  calendar.value?.next()
  retrieveEvents()
}
</script>

<template>
  <div class="fill-height d-flex flex-column">
    <MainTitle icon="mdi-calendar-month" class="mb-2 mb-sm-3">Agenda</MainTitle>

    <div class="d-flex align-center flex-wrap gap-1 mb-2 mb-sm-3">
      <div class="mr-sm-1">
        <v-btn
          icon
          variant="text"
          density="comfortable"
          :size="xs ? 'small' : 'default'"
          @click="previousMonth()">
          <v-icon icon="mdi-chevron-left" />
        </v-btn>
        <v-btn
          icon
          variant="text"
          density="comfortable"
          :size="xs ? 'small' : 'default'"
          @click="nextMonth()">
          <v-icon icon="mdi-chevron-right" />
        </v-btn>
      </div>

      <v-btn
        :disabled="isCurrentMonthSelected"
        :size="xs ? 'small' : 'default'"
        class="mr-1"
        @click="setCalendarToNow()">
        now
      </v-btn>

      <h4 class="text-body-large text-sm-headline-small flex-grow-1">{{ monthSelected }}</h4>

      <v-btn :size="xs ? 'small' : 'default'" @click="openEventDialog()">
        <v-icon icon="mdi-plus" start />
        <template v-if="smAndUp">event</template>
      </v-btn>
    </div>

    <v-sheet rounded min-height="500px" height="75svh">
      <v-calendar
        ref="calendar"
        v-model="value"
        :events="events"
        :first-day-of-week="1"
        event-color="event"
        event-start="startDate"
        event-end="endDate"
        :event-margin-bottom="2"
        :event-ripple="false"
        color="accent"
        class="calendar"
        @click:day="handleClickOnDay">
        <template #day-label="{ day, present }">
          <v-hover v-slot="{ isHovering, props }">
            <div
              v-bind="props"
              class="day-label"
              :class="{
                'day-label--present': present,
                'day-label--hovering': isHovering,
              }">
              {{ day }}
            </div>
          </v-hover>
        </template>
        <template #event="{ event }">
          <div class="d-flex align-center px-2">
            <template v-if="event.project">
              <v-avatar
                :color="event.project.archived ? 'projectArchived' : 'project'"
                size="10"
                class="mr-1">
              </v-avatar>
            </template>

            <template v-if="event.takesWholeDay">
              <v-icon icon="mdi-white-balance-sunny" size="x-small" />
            </template>
            <template v-else>
              <template v-if="event.startDate === event.endDate">
                <span class="font-weight-bold">{{ event.startTime }}</span>
                <v-icon icon="mdi-arrow-right" size="x-small" class="calendar-arrow" />
                <span class="font-weight-bold">{{ event.endTime }}</span>
              </template>
              <template v-else-if="event.endDate">
                <span class="font-weight-bold">
                  {{ dateFormat(event.startDate, 'DD/MM') }}
                </span>
                <v-icon icon="mdi-arrow-right" size="x-small" class="calendar-arrow" />
                <span class="font-weight-bold">
                  {{ dateFormat(event.endDate, 'DD/MM') }}
                </span>
              </template>
              <template v-else-if="event.startTime">
                <span class="font-weight-bold">{{ event.startTime }}</span>
              </template>
            </template>

            <span class="ml-1 text-truncate" :title="event.name">{{ event.name }}</span>
          </div>
        </template>
      </v-calendar>
    </v-sheet>

    <v-dialog v-model="eventDialog" :width="dialogWidth" :fullscreen="dialogFullscreen">
      <EventDialog
        :is-dialog-open="eventDialog"
        :event="eventToUpdate"
        :start-date-placeholder="startDatePlaceholder"
        @create="createEvent($event)"
        @update="updateEvent($event)"
        @delete="deleteEvent($event)"
        @close="eventDialog = false">
      </EventDialog>
    </v-dialog>

    <EventDayDialog
      v-model="eventDayDialog"
      :date="eventDayDialogDate ?? ''"
      :events="eventDayDialogEvents"
      @open-event-dialog="openEventDialog({ startDatePlaceholder: $event })"
      @update="updateEvent($event)"
      @delete="deleteEvent($event)">
    </EventDayDialog>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/colors';

.calendar {
  :deep(.v-calendar-weekly__head-weekday) {
    // même fond que les jours hors-mois (les cases en dessous)
    background-color: rgb(var(--v-theme-surface));

    &.v-outside {
      background-color: rgb(var(--v-theme-background));
    }
  }

  :deep(.v-calendar-weekly__day) {
    cursor: pointer;

    .v-event {
      pointer-events: none;
    }

    .v-event-more {
      background-color: inherit;
    }

    &:hover {
      background-color: map.get(colors.$grey, 'darken-3');
    }

    &.v-present {
      background-color: map.get(colors.$grey, 'darken-3');

      &:hover {
        background-color: map.get(colors.$grey, 'darken-2');
      }
    }

    &.v-outside {
      background-color: rgb(var(--v-theme-background));

      &:hover {
        background-color: map.get(colors.$grey, 'darken-4');
      }
    }
  }

  .day-label {
    width: 100%;
    height: 100%;
    cursor: pointer;
    color: map.get(colors.$grey, 'lighten-1'); // #bdbdbd (défaut)

    &--hovering {
      color: rgb(var(--v-theme-on-surface)); // blanc
    }

    &--present {
      color: rgb(var(--v-theme-accent)); // bleu accent
    }

    &--present.day-label--hovering {
      color: rgb(var(--v-theme-accent));
      filter: brightness(1.3); // accent éclairci (ex-`text--lighten-3`)
    }
  }

  .calendar-arrow {
    margin-left: 1px;
    margin-right: 1px;
  }
}
</style>
