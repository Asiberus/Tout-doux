<script setup lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import HalfDialog from '@/components/HalfDialog.vue'
import { EventExtendedModel, EventPostOrPatch } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import { ref, useTemplateRef } from 'vue'
import { useDisplay } from 'vuetify'

const { xs, smAndUp, width } = useDisplay()

const show = defineModel<boolean>()

const { date, events } = defineProps<{
  date: string
  events: EventExtendedModel[]
}>()

defineEmits<{
  'open-event-dialog': [date: string]
  update: [event: { id: number; data: EventPostOrPatch }]
  delete: [id: number]
}>()

const scrollableElement = useTemplateRef('dialogContent')

const isScrollingOnContent = ref(false)

function touchStartEvent(): void {
  if (!scrollableElement.value) return
  // We detect if the touch-down is a scroll on the content
  isScrollingOnContent.value = scrollableElement.value.scrollTop > 0
}

function handleTouchEvent(type: string): void {
  if (type === 'right' && width.value >= 400) show.value = false
  else if (type === 'down' && width.value < 400) scrollDownEvent()
}

function scrollDownEvent(): void {
  if (!isScrollingOnContent.value) show.value = false
}
</script>

<template>
  <HalfDialog v-model="show">
    <v-card
      v-touch="{
        start: () => touchStartEvent(),
        right: () => handleTouchEvent('right'),
        down: () => handleTouchEvent('down'),
      }"
      height="100%"
      class="d-flex flex-column">
      <v-toolbar class="flex-grow-0">
        <div class="text-body-large text-sm-title-large mr-2 ml-4">
          Events : {{ dateFormat(date, 'D MMMM YYYY') }}
        </div>

        <v-btn
          :size="xs ? 'small' : 'default'"
          :icon="xs"
          class="new-event-btn"
          @click="$emit('open-event-dialog', date)">
          <v-icon>mdi-plus</v-icon>
          <template v-if="smAndUp">event</template>
        </v-btn>

        <v-spacer />

        <v-btn icon variant="text" density="comfortable" @click="show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-text ref="dialogContent" class="overflow-auto flex-grow-1">
        <template v-if="events.length > 0">
          <div class="d-flex flex-column gap-3 pt-3">
            <EventItemCard
              v-for="event of events"
              :key="event.id"
              :event
              :project="event.project"
              :clickable="event.project ? !event.project.archived : true"
              color="event"
              caret
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
              <p class="text-body-large text-sm-title-large text-white mb-0">
                No event for that day.
              </p>
            </template>
          </EmptyListDisplay>
        </template>
      </v-card-text>
    </v-card>
  </HalfDialog>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.empty-img {
  width: clamp(250px, 50%, 350px);
}

@media #{map.get(variables.$display-breakpoints, 'sm-and-up')} {
  .new-event-btn {
    background-color: #353535 !important;
  }
}
</style>
