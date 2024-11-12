<script setup lang="ts">
import { EventModel, EventPostOrPatch } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import { isEventRelatedToDate, sortEvents } from '@/utils/event.utils'
import EventDayDialog from '@/views/components/event/EventDayDialog.vue'
import EventDialog from '@/views/components/event/EventDialog.vue'
import EventTooltip from '@/views/components/event/EventTooltip.vue'
import moment from 'moment'
import MainTitle from '@/components/MainTitle.vue'
import { getDialogWidth } from '@/utils/dialog.utils'
import { computed, onBeforeMount, ref, useTemplateRef } from 'vue'
import { eventApi } from '@/api'
import { useDisplay } from 'vuetify'

const display = useDisplay()

onBeforeMount(() => {
  retrieveEvents()
})

const calendar = useTemplateRef('calendar')

const events = ref<EventModel[]>([]) // TODO : think of using Set
const value = ref(moment().format('YYYY-MM-DD'))
const weekdays = [1, 2, 3, 4, 5, 6, 0]

const eventDialog = ref(false)
const eventToUpdate = ref<EventModel | null>(null)
const startDatePlaceholder = ref<string | null>(null)

const eventTooltip = ref(false)
const eventTooltipKey = ref(0)
const eventSelected = ref<EventModel | null>(null)
const eventTooltipElement = ref<EventTarget | null>(null)

const eventDayDialog = ref(false)
const eventDayDialogDate = ref<string | null>(null)
const eventDayDialogEvents = ref<EventModel[]>([])

let doubleClickTimer: number | undefined = undefined

const monthSelected = computed<string>(() => {
  return moment(value).format('MMMM YYYY')
})

const isCurrentMonthSelected = computed<boolean>(() => {
  return moment(value).isSame(moment(), 'month')
})

function retrieveEvents(): void {
  events.value = []
  const month = moment(value).month() + 1 // Month count start at 0
  const year = moment(value).year()
  eventApi.getEvents({ month, year }).then(
    response => (events.value = response),
    error => console.error(error)
  )
}

function openEventDialog(
  options: { event?: EventModel; startDatePlaceholder?: string } = {}
): void {
  eventToUpdate.value = options.event ?? null
  startDatePlaceholder.value = options.startDatePlaceholder ?? null
  eventDialog.value = true
}

// TODO : See if this can be optimized
function setDayDialogEventList(options: { sort: boolean } = { sort: true }): void {
  if (!eventDayDialogDate.value) return

  eventDayDialogEvents.value = events.value.filter(
    event => isEventRelatedToDate(event, <string>eventDayDialogDate) // We have tested that date is not null before
  )
  if (options.sort) eventDayDialogEvents.value.sort((event1, event2) => sortEvents(event1, event2))
}

function createEvent(event: EventPostOrPatch): void {
  eventSelected.value = null
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
      if (eventSelected.value?.id === updatedEvent.id) eventSelected.value = updatedEvent
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

// Tooltip removed temporally
function openEventTooltip($event: { nativeEvent: MouseEvent; event: EventModel }): void {
  const { nativeEvent, event } = $event

  nativeEvent.stopImmediatePropagation()
  eventTooltipKey.value += 1 // Hack to re-render v-menu component
  eventSelected.value = event
  eventTooltipElement.value = nativeEvent.target
  if (!eventTooltip.value) eventTooltip.value = true
}

function openDayDialog(date: string): void {
  eventDayDialog.value = true
  eventDayDialogDate.value = date
  setDayDialogEventList()
}

function handleClickOnDay($event: { date: string }): void {
  const { date } = $event
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
  calendar.value.prev()
  retrieveEvents()
}

function nextMonth(): void {
  calendar.value.next()
  retrieveEvents()
}
</script>

<template>
  <div class="fill-height d-flex flex-column">
    <MainTitle icon="mdi-calendar-month" class="mb-2 mb-sm-3">Agenda</MainTitle>

    <div class="d-flex align-center flex-wrap gap-1 mb-2 mb-sm-3">
      <div class="mr-sm-1">
        <v-btn icon :size="display.xs ? 'small' : 'default'" @click="previousMonth()">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <v-btn icon :size="display.xs ? 'small' : 'default'" @click="nextMonth()">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>

      <v-btn
        :disabled="isCurrentMonthSelected"
        :size="display.xs ? 'small' : 'default'"
        class="mr-1"
        @click="setCalendarToNow()">
        now
      </v-btn>

      <h4 class="text-body-1 text-sm-h5 flex-grow-1">{{ monthSelected }}</h4>

      <v-btn :size="display.xs ? 'small' : 'default'" @click="openEventDialog()">
        <v-icon>mdi-plus</v-icon>
        <template v-if="display.smAndUp">event</template>
      </v-btn>
    </div>

    <v-sheet rounded min-height="500px" height="75svh">
      <v-calendar
        ref="calendar"
        v-model="value"
        :events="events"
        :weekdays="weekdays"
        event-color="event"
        event-start="startDate"
        event-end="endDate"
        :event-margin-bottom="2"
        :event-ripple="false"
        color="accent"
        class="calendar"
        @click:day="handleClickOnDay($event)">
        <template #day-label="{ day, present, date }">
          <v-hover v-slot="{ hover }">
            <div
              class="day-label"
              :class="{
                'accent--text': present,
                'grey--text text--lighten-1': !hover,
                'white--text': hover,
                'text--lighten-3': present && hover,
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
              <v-icon size="x-small">mdi-white-balance-sunny</v-icon>
            </template>
            <template v-else>
              <template v-if="event.startDate === event.endDate">
                <span class="font-weight-bold">{{ event.startTime }}</span>
                <v-icon size="x-small" class="calendar-arrow">mdi-arrow-right</v-icon>
                <span class="font-weight-bold">{{ event.endTime }}</span>
              </template>
              <template v-else-if="event.endDate">
                <span class="font-weight-bold">
                  {{ dateFormat(event.startDate, 'DD/MM') }}
                </span>
                <v-icon size="x-small" class="calendar-arrow">mdi-arrow-right</v-icon>
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
      <!-- The Tooltip menu is removed temporally. See if we keep it or not. -->
      <v-menu
        :key="'event-info-' + eventTooltipKey"
        v-model="eventTooltip"
        :close-on-content-click="false"
        :activator="eventTooltipElement"
        offset-x
        min-width="30rem"
        max-width="40rem">
        <template v-if="eventSelected">
          <EventTooltip :event="eventSelected" @update="openEventDialog({ event: $event })">
          </EventTooltip>
        </template>
      </v-menu>
    </v-sheet>

    <v-dialog v-model="eventDialog" :width="getDialogWidth()" :fullscreen="display.smAndDown">
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
      :date="eventDayDialogDate"
      :events="eventDayDialogEvents"
      @open-event-dialog="openEventDialog({ startDatePlaceholder: $event })"
      @update="updateEvent($event)"
      @delete="deleteEvent($event)">
    </EventDayDialog>
  </div>
</template>

<style scoped lang="scss">
.calendar {
  :deep(.v-calendar-weekly__day) {
    cursor: pointer;

    .v-event {
      pointer-events: none;
    }

    .v-event-more {
      background-color: inherit;
    }

    &:hover {
      background-color: #424242;
    }

    &.v-present {
      background-color: #515151;
    }

    &.v-outside {
      &:hover {
        background-color: #303030;
      }
    }
  }

  .day-label {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  .calendar-arrow {
    margin-left: 1px;
    margin-right: 1px;
  }
}
</style>
