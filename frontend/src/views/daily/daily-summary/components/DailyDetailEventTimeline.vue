<script setup lang="ts">
import { EventExtendedModel } from '@/models/event.model'
import moment from 'moment/moment'
import { isPassed } from '@/utils/event.utils'
import { useToday } from '@/composables/useToday'
import { useNow } from '@/composables/useNow'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

const { xs } = useDisplay()

const props = defineProps<{
  events: EventExtendedModel[]
  date: string
}>()

const { today } = useToday()
const { now } = useNow()

const eventText = computed<string>(() => {
  const count = props.events.length
  const plural = count > 1 ? 'events' : 'event'

  if (moment(props.date).isAfter(today.value, 'day'))
    return `You have ${count} ${plural} planned that day !`
  if (today.value.isSame(props.date, 'day')) return `You have ${count} ${plural} today !`
  return `You had ${count} ${plural} that day !`
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
        :dot-color="isPassed(event, now) ? 'passedEvent' : 'event'"
        :icon="isPassed(event, now) ? 'mdi-check' : 'mdi-calendar-clock'"
        :icon-color="isPassed(event, now) ? 'grey' : 'white'"
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
  // Le `height: 100%` de Vuetify étire les rangées de la grille quand la timeline est seule dans
  // le dialog : l'écart entre les cartes grossit d'autant
  height: auto;

  // Borne le 3e track, sinon le `auto` de Vuetify suit le max-content du texte en nowrap
  grid-template-columns: 0 min-content minmax(0, 1fr);

  --bar-left: 47px;
  --divider-width: 96px;
  --divider-justify-content: center;
  // Vuetify fait dépasser chaque segment du rail de 12px en dur, la moitié de son `row-gap` : l'écart
  // et ce dépassement passent par la même variable pour que les segments restent jointifs
  --rail-overhang: 12px;
  row-gap: calc(2 * var(--rail-overhang));

  @media #{map.get(variables.$display-breakpoints, 'xs')} {
    --bar-left: 11px;
    --divider-width: 40px;
    --rail-overhang: 6px;
  }

  @media #{map.get(variables.$display-breakpoints, 'sm')} {
    --bar-left: 18px;
    --divider-width: 55px;
    --rail-overhang: 9px;
  }

  // Le modificateur est nécessaire pour égaler la spécificité du sélecteur Vuetify qui pose ces 24px
  &.v-timeline--side-end .v-timeline-item :deep(.v-timeline-item__body) {
    padding-inline-start: 0;

    @media #{map.get(variables.$display-breakpoints, 'sm')} {
      padding-inline-start: 8px;
    }

    @media #{map.get(variables.$display-breakpoints, 'xs')} {
      padding-inline-start: 12px;
    }
  }

  .v-timeline-item :deep(.v-timeline-divider__before) {
    top: calc(-1 * var(--rail-overhang));
    height: calc(
      var(--v-timeline-line-size-base) + var(--rail-overhang) - var(--v-timeline-line-inset)
    );
  }

  .v-timeline-item :deep(.v-timeline-divider__after) {
    bottom: calc(-1 * var(--rail-overhang));
    height: calc(
      var(--v-timeline-line-size-base) + var(--rail-overhang) - var(--v-timeline-line-inset)
    );
  }

  .v-timeline-item {
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
