<script setup lang="ts">
import { EventExtendedModel } from '@/models/event.model'
import moment from 'moment/moment'
import { isPassed } from '@/utils/event.utils'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

const { xs } = useDisplay()

const props = defineProps<{
  events: EventExtendedModel[]
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
    <h4 class="text-headline-small text-lg-headline-large">Events</h4>
    <p class="text-body-large text-grey-lighten-1">
      {{ eventText }}
    </p>

    <v-timeline density="compact" truncate-line="both">
      <v-timeline-item
        v-for="event of events"
        :key="`event-${event.id}`"
        :dot-color="isPassed(event) ? 'passedEvent' : 'event'"
        :icon="isPassed(event) ? 'mdi-check' : 'mdi-calendar-clock'"
        :icon-color="isPassed(event) ? 'grey' : 'white'"
        :size="xs ? 'small' : 'default'"
        fill-dot>
        <EventItemCard
          :event
          :project="event.project"
          :day-selected="true"
          :clickable="false"
          caret
          :hover-background="false"
          :margin-bottom="false" />
      </v-timeline-item>
    </v-timeline>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use '@/styles/breakpoints' as variables;

.v-timeline {
  padding-top: 0;

  // Borne le 3e track, sinon le `auto` de Vuetify suit le max-content du texte en nowrap
  grid-template-columns: 0 min-content minmax(0, 1fr);

  --bar-left: 47px;
  --divider-width: 96px;
  --divider-justify-content: center;

  @media #{map.get(variables.$display-breakpoints, 'xs')} {
    --bar-left: 11px;
    --divider-width: 40px;
    --divider-justify-content: flex-start;
  }

  @media #{map.get(variables.$display-breakpoints, 'sm')} {
    --bar-left: 18px;
    --divider-width: 55px;
    --divider-justify-content: flex-start;
  }

  // Le modificateur est nécessaire pour égaler la spécificité du sélecteur Vuetify qui pose ces 24px
  &.v-timeline--side-end .v-timeline-item :deep(.v-timeline-item__body) {
    padding-inline-start: 0;
  }

  .v-timeline-item {
    @media #{map.get(variables.$display-breakpoints, 'xs')} {
      padding-bottom: 16px;
    }

    &:last-child {
      padding-bottom: 0;
    }

    & :deep(.v-timeline-item__body) {
      width: 100%;
    }

    & :deep(.v-timeline-divider) {
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
