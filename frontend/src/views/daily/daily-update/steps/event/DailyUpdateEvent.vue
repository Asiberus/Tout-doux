<template>
    <div>
        <div class="d-flex justify-space-between align-center mb-4">
            <h5 class="text-h5">Events of the day</h5>
            <v-dialog v-model="eventDialog" width="60%">
                <template #activator="{ on, attrs }">
                    <v-btn v-bind="attrs" v-on="on">
                        <v-icon left>mdi-plus</v-icon>
                        event
                    </v-btn>
                </template>
                <EventDialog
                    :is-dialog-open="eventDialog"
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
                    :ripple="event.project ? !event.project.archived : true"
                    color="event"
                    :caret="true"
                    :day-selected="true"
                    :show-icon="true"
                    :change-passed-text-color="false"
                    @update="updateEvent"
                    @delete="deleteEvent">
                </EventItemCard>
            </div>
        </template>
        <template v-else>
            <EmptyListDisplay message="No event for today!" class="mt-10">
                <template #img>
                    <img src="../../../../../assets/no_events.svg" width="300" alt="No events" />
                </template>
            </EmptyListDisplay>
        </template>
    </div>
</template>

<script lang="ts">
import { eventService } from '@/api/event.api'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { EventExtended, EventModel } from '@/models/event.model'
import { isEventRelatedToDate, sortEvents } from '@/utils/event.util'
import EventDialog from '@/views/components/event/EventDialog.vue'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import moment from 'moment'
import { Component, Emit, Prop, Vue } from 'vue-property-decorator'

@Component({ components: { EventItemCard, EventDialog, EmptyListDisplay } })
export default class DailyUpdateEvent extends Vue {
    @Prop({ required: true }) private date!: string

    eventList: EventExtended[] = []
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

    // TODO : See if we block the creation of event non related to date
    createEvent(event: Partial<EventModel>): void {
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

    // TODO : See if we block the update of event non related to date
    updateEvent({ id, data }: { id: number; data: Partial<EventModel> }): void {
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

<style scoped lang="scss"></style>
