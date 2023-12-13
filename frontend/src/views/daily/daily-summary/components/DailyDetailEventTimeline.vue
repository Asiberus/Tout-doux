<template>
    <div>
        <h4 class="text-h5 text-lg-h4">Events</h4>
        <p class="text-subtitle-1 grey--text text--lighten-1">
            {{ eventText }}
        </p>

        <v-timeline dense>
            <v-timeline-item
                v-for="event of events"
                :key="`event-${event.id}`"
                :color="isEventPassed(event) ? null : 'event'"
                :icon="isEventPassed(event) ? 'mdi-check' : 'mdi-calendar-clock'"
                :icon-color="isEventPassed(event) ? 'grey' : 'white'"
                :small="$vuetify.breakpoint.xsOnly"
                fill-dot>
                <EventItemCard
                    :event="event"
                    :project="event.project"
                    :day-selected="true"
                    :clickable="false"
                    :margin-bottom="false">
                </EventItemCard>
            </v-timeline-item>
        </v-timeline>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { EventModel } from '@/models/event.model'
import moment from 'moment/moment'
import { isPassed } from '@/utils/event.utils'
import EventItemCard from '@/views/components/event/EventItemCard.vue'

@Component({ components: { EventItemCard } })
export default class DailyDetailEventTimeline extends Vue {
    @Prop({ required: true }) date!: string
    @Prop({ required: true }) events!: EventModel[]

    get isToday(): boolean {
        return moment().isSame(this.date, 'day')
    }

    get eventText(): string {
        if (this.isToday)
            return `You have ${this.events.length} ${
                this.events.length > 1 ? 'events' : 'event'
            } today !`
        else
            return `You had ${this.events.length} ${
                this.events.length > 1 ? 'events' : 'event'
            } that day !`
    }

    isEventPassed(event: EventModel): boolean {
        return isPassed(event)
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.v-timeline {
    padding-top: 0;

    --bar-left: 47px;
    --divider-width: 96px;
    --divider-justify-content: center;

    @media #{map-get($display-breakpoints, 'xs-only')} {
        --bar-left: 11px;
        --divider-width: 40px;
        --divider-justify-content: flex-start;
    }

    @media #{map-get($display-breakpoints, 'sm-only')} {
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
        @media #{map-get($display-breakpoints, 'xs-only')} {
            padding-bottom: 16px;
        }

        &:last-child {
            padding-bottom: 0;
        }

        &::v-deep .v-timeline-item__body {
            max-width: calc(100% - var(--divider-width));
        }

        &::v-deep .v-timeline-item__divider {
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
