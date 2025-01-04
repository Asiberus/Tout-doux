<script setup lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import { EventModel, EventPostOrPatch } from '@/models/event.model'
import { isPassed } from '@/utils/event.utils'
import EventDialog from '@/views/components/event/EventDialog.vue'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import { getDialogWidth } from '@/utils/dialog.utils'
import { computed, ref } from 'vue'
import { useProjectStore } from '@/store'
import { useDisplay } from 'vuetify'

const display = useDisplay()
const projectStore = useProjectStore()

const eventDialog = ref(false)
const displayPassedEvent = ref(false)

// TODO : utiliser des getters
const comingEvents = computed<EventModel[]>(() =>
  projectStore.currentProject.events.filter(event => !isPassed(event))
)

const passedEvents = computed<EventModel[]>(() =>
  projectStore.currentProject.events.filter(event => isPassed(event)).reverse()
)

function createEvent(event: EventPostOrPatch): void {
  eventDialog.value = false
  event.projectId = projectStore.currentProject.id
  projectStore.addEvent(event)
}

function updateEvent(payload: { id: number; data: EventPostOrPatch }): void {
  const { id, data } = payload
  projectStore.editEvent(id, data)
}

function deleteEvent(id: number): void {
  projectStore.deleteEvent(id)
}
</script>

<template>
  <div class="flex-grow-1 d-flex flex-column">
    <div class="d-flex align-center column-gap-2 row-gap-1 mb-3">
      <h3 class="text-h6 text-sm-h5 flex-grow-1">Events</h3>

      <div class="d-flex justify-space-between align-center gap-2">
        <FilterChip
          v-if="projectStore.currentProject.events.length > 0"
          v-model="displayPassedEvent"
          color="event"
          icon="mdi-clock-check-outline">
          Passed
        </FilterChip>

        <v-dialog v-model="eventDialog" :width="getDialogWidth()" :fullscreen="display.smAndDown">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              :disabled="projectStore.currentProject.archived"
              :block="display.xs && projectStore.currentProject.events.length === 0">
              <v-icon start>mdi-plus</v-icon>
              event
            </v-btn>
          </template>
          <EventDialog
            :is-dialog-open="eventDialog"
            @submit="createEvent($event)"
            @close="eventDialog = false">
          </EventDialog>
        </v-dialog>
      </div>
    </div>

    <template v-if="!displayPassedEvent">
      <template v-if="comingEvents.length > 0">
        <div class="pl-3">
          <EventItemCard
            v-for="event of comingEvents"
            :key="event.id"
            :event
            :disabled="projectStore.currentProject.archived"
            :show-icon="true"
            @update="updateEvent($event)"
            @delete="deleteEvent($event)">
          </EventItemCard>
        </div>
      </template>
      <template v-else>
        <EmptyListDisplay message="This project has no coming events." class="empty-list-display">
          <template #img>
            <img
              src="../../../../assets/no_events.svg"
              alt="No events"
              class="empty-list-display__img" />
          </template>
        </EmptyListDisplay>
      </template>
    </template>
    <template v-else>
      <template v-if="passedEvents.length > 0">
        <div class="pl-3">
          <EventItemCard
            v-for="event of passedEvents"
            :key="event.id"
            :event
            :show-icon="true"
            :disabled="projectStore.currentProject.archived"
            @update="updateEvent($event)"
            @delete="deleteEvent($event)">
          </EventItemCard>
        </div>
      </template>
      <template v-else>
        <EmptyListDisplay message="This project has no past events." class="empty-list-display">
          <template #img>
            <img
              src="../../../../assets/no_events.svg"
              alt="No events"
              class="empty-list-display__img" />
          </template>
        </EmptyListDisplay>
      </template>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.empty-list-display {
  padding-top: 20px;
  flex-grow: 1;

  &__img {
    width: clamp(200px, 50%, 300px);

    @media #{map.get(variables.$display-breakpoints, 'xl')} {
      width: clamp(200px, 50%, 400px);
    }
  }
}
</style>
