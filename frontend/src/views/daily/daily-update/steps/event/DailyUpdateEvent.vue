<template>
    <div class="d-flex flex-column h-100">
        <div class="d-flex align-center flex-wrap gap-2 mb-3">
            <div class="flex-grow-1 d-flex align-center gap-2">
                <h5 class="text-h5">Events of the day</h5>
                <v-chip v-if="eventList.length > 0" small>{{ eventList.length }}</v-chip>
            </div>

            <v-dialog
                v-model="eventDialog"
                :width="getDialogWidth()"
                :fullscreen="$vuetify.breakpoint.smAndDown">
                <template #activator="{ on, attrs }">
                    <v-btn v-bind="attrs" v-on="on">
                        <v-icon :left="$vuetify.breakpoint.smAndUp">mdi-plus</v-icon>
                        <template v-if="$vuetify.breakpoint.smAndUp">event</template>
                    </v-btn>
                </template>
                <EventDialog
                    :is-dialog-open="eventDialog"
                    :related-to-date="date"
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
                    @delete="deleteEvent">
                </EventItemCard>
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

<script lang="ts">
import { eventService } from '@/api/event.api'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { EventModel, EventPostOrPatch } from '@/models/event.model'
import { isEventRelatedToDate, sortEvents } from '@/utils/event.utils'
import EventDialog from '@/views/components/event/EventDialog.vue'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import { Component, Emit, Prop, Vue } from 'vue-property-decorator'
import { getDialogWidth } from '@/utils/dialog.utils'

@Component({
    methods: { getDialogWidth },
    components: { EventItemCard, EventDialog, EmptyListDisplay },
})
export default class DailyUpdateEvent extends Vue {
    @Prop({ required: true }) private date!: string

    eventList: EventModel[] = []
    eventDialog = false

    created(): void {
        this.retrieveEventList()
    }

    @Emit('daily-event-count')
    private emitDailyEventCount(): number {
        return this.eventList.length
    }

    private retrieveEventList(): void {
        eventService.getEvents({ date: this.date }).then(
            (response: any) => {
                this.eventList = response.body
                this.sortEventList()
                this.emitDailyEventCount()
            },
            (error: any) => console.error(error)
        )
    }

    private sortEventList(): void {
        this.eventList.sort((event1, event2) => sortEvents(event1, event2))
    }

    createEvent(event: EventPostOrPatch): void {
        eventService.createEvent(event, { extended: true }).then(
            (response: any) => {
                const event = response.body
                if (isEventRelatedToDate(event, this.date)) {
                    this.eventList.push(response.body)
                    this.sortEventList()
                    this.emitDailyEventCount()
                }
                this.eventDialog = false
            },
            (error: any) => console.error(error)
        )
    }

    updateEvent({ id, data }: { id: number; data: EventPostOrPatch }): void {
        eventService.updateEventById(id, data, { extended: true }).then(
            (response: any) => {
                const eventIndex = this.eventList.findIndex(e => e.id === id)
                if (eventIndex === -1) return

                const event = response.body
                if (isEventRelatedToDate(event, this.date)) {
                    this.eventList.splice(eventIndex, 1, response.body)
                    this.sortEventList()
                } else {
                    this.eventList.splice(eventIndex, 1)
                    this.emitDailyEventCount()
                }

                this.eventDialog = false
            },
            (error: any) => console.error(error)
        )
    }

    deleteEvent(id: number): void {
        eventService.deleteEventById(id).then(
            () => {
                const eventIndex = this.eventList.findIndex(event => event.id === id)
                if (eventIndex === -1) return

                this.eventList.splice(eventIndex, 1)
                this.eventDialog = false
                this.emitDailyEventCount()
            },
            (error: any) => console.error(error)
        )
    }
}
</script>

<style scoped lang="scss">
.empty-list-display {
    flex-grow: 1;

    &__img {
        width: clamp(200px, 50%, 350px);
    }
}
</style>
