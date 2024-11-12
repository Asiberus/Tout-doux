<script setup lang="ts">
import { EventModel } from '@/models/event.model'
import moment from 'moment/moment'
import { isPassed } from '@/utils/event.utils'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

const display = useDisplay()

const props = defineProps<{
  events: EventModel[]
  date: string
}>()

const eventText = computed<string>(() => {
  if (moment().isSame(props.date, 'day'))
    return `You have ${props.events.length} ${props.events.length > 1 ? 'events' : 'event'} today !`
  else
    return `You had ${props.events.length} ${props.events.length > 1 ? 'events' : 'event'} that day !`
})
</script>

<template>
  <div>
    <h4 class="text-h5 text-lg-h4">Events</h4>
    <p class="text-subtitle-1 text-grey-lighten-1">
      {{ eventText }}
    </p>

    <v-timeline density="compact">
      <v-timeline-item
        v-for="event of events"
        :key="`event-${event.id}`"
        :dot-color="isPassed(event) ? null : 'event'"
        :icon="isPassed(event) ? 'mdi-check' : 'mdi-calendar-clock'"
        :icon-color="isPassed(event) ? 'grey' : 'white'"
        :size="display.xs ? 'small' : 'default'"
        fill-dot>
        <EventItemCard
          :event
          :project="event.project"
          :day-selected="true"
          :clickable="false"
          :margin-bottom="false" />
      </v-timeline-item>
    </v-timeline>
  </div>
</template>

<style scoped lang="scss">
@import 'vuetify/settings';

.v-timeline {
  padding-top: 0;

  --bar-left: 47px;
  --divider-width: 96px;
  --divider-justify-content: center;

  @media #{map-get($display-breakpoints, 'xs')} {
    --bar-left: 11px;
    --divider-width: 40px;
    --divider-justify-content: flex-start;
  }

  @media #{map-get($display-breakpoints, 'sm')} {
    --bar-left: 18px;
    --divider-width: 55px;
    --divider-justify-content: flex-start;
  }

  &::before {
    top: 36px;
    left: var(--bar-left) !important;
    height: calc(100% - 60px);
  }

  .v-timeline-item {
    @media #{map-get($display-breakpoints, 'xs')} {
      padding-bottom: 16px;
    }

    &:last-child {
      padding-bottom: 0;
    }

    & :deep(.v-timeline-item__body) {
      max-width: calc(100% - var(--divider-width));
    }

    & :deep(.v-timeline-item__divider) {
      min-width: var(--divider-width);
      justify-content: var(--divider-justify-content);
    }
  }

  .icon-wrapper {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
