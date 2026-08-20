<script setup lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import { EventPostOrPatch } from '@/models/event.model'
import EventDialog from '@/views/components/event/EventDialog.vue'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import { useDialogWidth } from '@/composables/useDialogWidth'
import { ref } from 'vue'
import { useProjectStore } from '@/store'
import { useDisplay } from 'vuetify'

const { xs } = useDisplay()
const { dialogWidth, dialogFullscreen } = useDialogWidth()
const projectStore = useProjectStore()

const eventDialog = ref(false)
const displayPassedEvent = ref(false)

function createEvent(event: EventPostOrPatch): void {
  eventDialog.value = false
  event.projectId = projectStore.loadedProject.id
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
      <h3 class="text-title-large text-sm-headline-small flex-grow-1">Events</h3>

      <div class="d-flex justify-space-between align-center gap-2">
        <FilterChip
          v-if="projectStore.loadedProject.events.length > 0"
          v-model="displayPassedEvent"
          color="event"
          icon="mdi-clock-check-outline">
          Passed
        </FilterChip>

        <v-dialog v-model="eventDialog" :width="dialogWidth" :fullscreen="dialogFullscreen">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              :disabled="projectStore.loadedProject.archived"
              :block="xs && projectStore.loadedProject.events.length === 0">
              <v-icon icon="mdi-plus" start />
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
      <template v-if="projectStore.comingEvents.length > 0">
        <div class="pl-3">
          <EventItemCard
            v-for="event of projectStore.comingEvents"
            :key="event.id"
            :event
            :disabled="projectStore.loadedProject.archived"
            :show-icon="true"
            margin-bottom
            caret
            clickable
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
      <template v-if="projectStore.passedEvents.length > 0">
        <div class="pl-3">
          <EventItemCard
            v-for="event of projectStore.passedEvents"
            :key="event.id"
            :event
            :show-icon="true"
            margin-bottom
            caret
            clickable
            :disabled="projectStore.loadedProject.archived"
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
@use '@/styles/breakpoints' as variables;

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
