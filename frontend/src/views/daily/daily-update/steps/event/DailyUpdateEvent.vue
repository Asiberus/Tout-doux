<script setup lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { EventExtendedModel, EventPostOrPatch } from '@/models/event.model'
import { isEventRelatedToDate, sortEvents } from '@/utils/event.utils'
import EventDialog from '@/views/components/event/EventDialog.vue'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import { useDialogWidth } from '@/composables/useDialogWidth'
import { onBeforeMount, ref } from 'vue'
import { eventApi } from '@/api'
import { useDisplay } from 'vuetify'

const { smAndUp } = useDisplay()
const { dialogWidth, dialogFullscreen } = useDialogWidth()

const props = defineProps<{
  date: string
}>()

const emit = defineEmits<{
  'daily-event-count': [count: number]
}>()

const eventList = ref<EventExtendedModel[]>([])
const eventDialog = ref(false)

onBeforeMount(() => retrieveEventList())

function retrieveEventList(): void {
  eventApi
    .getEvents({ date: props.date })
    .then(response => {
      eventList.value = response
      sortEventList()
      emit('daily-event-count', eventList.value.length)
    })
    .catch(error => console.error(error))
}

function sortEventList(): void {
  eventList.value.sort((event1, event2) => sortEvents(event1, event2))
}

function createEvent(event: EventPostOrPatch): void {
  eventApi
    .createEvent(event, { extended: true })
    .then(response => {
      if (isEventRelatedToDate(response, props.date)) {
        eventList.value.push(response)
        sortEventList()
        emit('daily-event-count', eventList.value.length)
      }
      eventDialog.value = false
    })
    .catch(error => console.error(error))
}

function updateEvent({ id, data }: { id: number; data: EventPostOrPatch }): void {
  eventApi
    .updateEventById(id, data, { extended: true })
    .then(response => {
      const eventIndex = eventList.value.findIndex(e => e.id === id)
      if (eventIndex === -1) return

      if (isEventRelatedToDate(response, props.date)) {
        eventList.value.splice(eventIndex, 1, response)
        sortEventList()
      } else {
        eventList.value.splice(eventIndex, 1)
        emit('daily-event-count', eventList.value.length)
      }

      eventDialog.value = false
    })
    .catch(error => console.error(error))
}

function deleteEvent(id: number): void {
  eventApi
    .deleteEventById(id)
    .then(() => {
      const eventIndex = eventList.value.findIndex(event => event.id === id)
      if (eventIndex === -1) return

      eventList.value.splice(eventIndex, 1)
      eventDialog.value = false
      emit('daily-event-count', eventList.value.length)
    })
    .catch(error => console.error(error))
}
</script>

<template>
  <div class="d-flex flex-column h-100">
    <div class="d-flex align-center flex-wrap gap-2 mb-3">
      <div class="flex-grow-1 d-flex align-center gap-2">
        <h5 class="text-headline-small">Events of the day</h5>
        <v-chip v-if="eventList.length > 0" size="small">{{ eventList.length }}</v-chip>
      </div>

      <v-dialog v-model="eventDialog" :width="dialogWidth" :fullscreen="dialogFullscreen">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps">
            <v-icon :start="smAndUp">mdi-plus</v-icon>
            <template v-if="smAndUp">event</template>
          </v-btn>
        </template>
        <EventDialog
          :is-dialog-open="eventDialog"
          :related-to-date="date"
          :start-date-placeholder="date"
          @submit="createEvent"
          @close="eventDialog = false">
        </EventDialog>
      </v-dialog>
    </div>

    <template v-if="eventList.length > 0">
      <div class="pl-3">
        <EventItemCard
          v-for="event of eventList"
          :key="`event-${event.id}`"
          :event="event"
          :project="event.project"
          :clickable="event.project ? !event.project.archived : true"
          color="event"
          :day-selected="true"
          :show-icon="true"
          :change-passed-text-color="false"
          :related-to-date="date"
          @update="updateEvent"
          @delete="deleteEvent" />
      </div>
    </template>
    <template v-else>
      <EmptyListDisplay message="No event for today!" class="empty-list-display">
        <template #img>
          <img
            src="../../../../../assets/no_events.svg"
            alt="No events"
            class="empty-list-display__img" />
        </template>
      </EmptyListDisplay>
    </template>
  </div>
</template>

<style scoped lang="scss">
.empty-list-display {
  flex-grow: 1;

  &__img {
    width: clamp(200px, 50%, 350px);
  }
}
</style>
