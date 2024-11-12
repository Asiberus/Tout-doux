<script setup lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import HalfDialog from '@/components/HalfDialog.vue'
import { EventModel, EventPostOrPatch } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import { ref, useTemplateRef } from 'vue'
import { useDisplay } from 'vuetify'

const display = useDisplay()

const show = defineModel<boolean>()

const { date, events } = defineProps<{
  date: string
  events: EventModel[]
}>()

defineEmits<{
  'open-event-dialog': [date: string]
  update: [event: { id: number; data: EventPostOrPatch }]
  delete: [id: number]
}>()

const scrollableElement = useTemplateRef('dialogContent')

const isScrollingOnContent = ref(false)

function touchStartEvent(): void {
  // We detect if the touch-down is a scroll on the content
  isScrollingOnContent.value = scrollableElement.scrollTop > 0
}

function handleTouchEvent(type: string): void {
  if (type === 'right' && display.width >= 400) show.value = false
  else if (type === 'down' && display.width < 400) scrollDownEvent()
}

function scrollDownEvent(): void {
  if (!isScrollingOnContent.value) show.value = false
}
</script>

<template>
  <HalfDialog :value="show" @input="show = $event">
    <v-card
      v-touch="{
        start: () => touchStartEvent(),
        right: () => handleTouchEvent('right'),
        down: () => handleTouchEvent('down'),
      }"
      height="100%"
      class="d-flex flex-column">
      <v-toolbar class="flex-grow-0">
        <v-toolbar-title class="text-body-1 text-sm-h6 mr-2">
          Events : {{ dateFormat(date, 'D MMMM YYYY') }}
        </v-toolbar-title>

        <v-btn
          :size="display.xs ? 'small' : 'default'"
          :icon="display.xs"
          class="new-event-btn"
          @click="$emit('open-event-dialog', date)">
          <v-icon>mdi-plus</v-icon>
          <template v-if="display.smAndUp">event</template>
        </v-btn>

        <v-spacer></v-spacer>

        <v-btn icon @click="show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-text ref="dialogContent" class="overflow-auto flex-grow-1">
        <template v-if="events.length > 0">
          <div class="d-flex flex-column gap-3 pt-3">
            <EventItemCard
              v-for="event of events"
              :event
              :project="event.project"
              :clickable="event.project ? !event.project.archived : true"
              color="event"
              :day-selected="true"
              :change-passed-text-color="false"
              :margin-bottom="false"
              @update="$emit('update', $event)"
              @delete="$emit('delete', $event)">
            </EventItemCard>
          </div>
        </template>
        <template v-else>
          <EmptyListDisplay class="d-flex justify-center align-center fill-height">
            <template #img>
              <img src="../../../assets/no_events.svg" alt="No events" class="empty-img" />
            </template>
            <template #message>
              <p class="text-body-1 text-sm-h6 text-white mb-0">No event for that day.</p>
            </template>
          </EmptyListDisplay>
        </template>
      </v-card-text>
    </v-card>
  </HalfDialog>
</template>

<style scoped lang="scss">
@import 'vuetify/settings';

.empty-img {
  width: clamp(250px, 50%, 350px);
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
  .new-event-btn {
    background-color: #353535 !important;
  }
}
</style>
