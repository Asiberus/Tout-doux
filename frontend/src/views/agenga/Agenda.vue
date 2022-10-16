<template>
    <div>
        <h1 class="flex-grow-1 text-h3 mb-5">Agenda</h1>
        <div class="d-flex align-center">
            <v-btn icon class="ma-2" @click="previousMonth()">
                <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
            {{ monthSelected }}
            <v-btn icon class="ma-2" @click="nextMonth()">
                <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
            <v-btn @click="setCalendarToNow()">now</v-btn>
            <v-spacer></v-spacer>
            <v-btn @click="eventDialog = true">
                <v-icon left>mdi-plus</v-icon>
                event
            </v-btn>
        </div>
        <v-row>
            <v-col cols="12">
                <v-sheet rounded height="600" color="white">
                    <v-calendar
                        ref="calendar"
                        v-model="value"
                        :events="events"
                        event-color="green"
                        event-start="start_date"
                        event-end="end_date"
                        :weekdays="weekdays"
                        @click:event="selectEvent($event)">
                    </v-calendar>
                    <v-menu
                        v-model="eventSelectedOpen"
                        :close-on-content-click="false"
                        :activator="selectedElement"
                        offset-x>
                        <template v-if="selectedEvent">
                            <EventTooltip :event="selectedEvent" @update="eventDialog = true">
                            </EventTooltip>
                        </template>
                    </v-menu>
                </v-sheet>
            </v-col>
        </v-row>

        <v-dialog v-model="eventDialog" width="60%">
            <EventDialog
                :is-dialog-open="eventDialog"
                :event="selectedEvent"
                @create="createEvent($event)"
                @update="updateEvent($event)"
                @delete="deleteEvent($event)"
                @close="eventDialog = false">
            </EventDialog>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import { eventService } from '@/api/event.api'
import { EventExtended, EventModel } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import EventDialog from '@/views/components/event/EventDialog.vue'
import EventTooltip from '@/views/components/event/EventTooltip.vue'
import moment from 'moment'
import { Component, Vue } from 'vue-property-decorator'

@Component({
    components: { EventDialog, EventTooltip },
})
export default class Agenda extends Vue {
    value = moment().format('YYYY-MM-DD')
    weekdays = [1, 2, 3, 4, 5, 6, 0]

    eventDialog = false

    eventSelectedOpen = false
    selectedEvent: EventExtended | null = null
    selectedElement: EventTarget | null = null

    events: EventExtended[] = []

    get monthSelected(): string {
        return moment(this.value).format('MMMM YYYY')
    }

    get calendar(): Vue & { next: () => void; prev: () => void } {
        return this.$refs.calendar as Vue & { next: () => void; prev: () => void }
    }

    created(): void {
        this.retrieveEvents()
    }

    retrieveEvents(): void {
        const month = moment(this.value).month() + 1 // Month count start at 0
        const year = moment(this.value).year()
        eventService.getEvents({ month, year }).then(
            (response: any) => (this.events = response.body.map(this.parseEvent)),
            // (response: any) => (this.events = response.body),
            (error: any) => console.error(error)
        )
    }

    // Parse start and end date
    parseEvent(event: EventExtended): EventExtended {
        return {
            ...event,
            start_date: dateFormat(event.start_date, 'YYYY-MM-DD hh:mm'),
            end_date: event.end_date ? dateFormat(event.end_date, 'YYYY-MM-DD hh:mm') : undefined,
        }
    }

    createEvent(event: Partial<EventModel>): void {
        eventService.createEvent(event).then(
            (response: any) => this.events.push(this.parseEvent(response.body)),
            (error: any) => console.error(error)
        )
        this.eventDialog = false
    }

    updateEvent({ id, event }: { id: number; event: Partial<EventModel> }): void {
        eventService.updateEventById(id, event).then(
            (response: any) => {
                const eventIndex = this.events.findIndex(e => e.id === id)
                if (eventIndex === -1) return

                this.events.splice(eventIndex, 1, this.parseEvent(response.body))
            },
            (error: any) => console.error(error)
        )
        this.selectedEvent = null
        this.eventDialog = false
    }

    deleteEvent(id: number): void {
        eventService.deleteEventById(id).then(
            (response: any) => console.log('Success', response),
            (error: any) => console.error(error)
        )
    }

    selectEvent($event: { nativeEvent: Event; event: EventExtended }): void {
        const { nativeEvent, event } = $event
        const open = () => {
            this.selectedEvent = event
            this.selectedElement = nativeEvent.target
            requestAnimationFrame(() =>
                requestAnimationFrame(() => (this.eventSelectedOpen = true))
            )
        }

        if (this.eventSelectedOpen) {
            this.eventSelectedOpen = false
            requestAnimationFrame(() => requestAnimationFrame(() => open()))
        } else {
            open()
        }

        nativeEvent.stopPropagation()
    }

    setCalendarToNow(): void {
        this.value = moment().format('YYYY-MM-DD')
        this.retrieveEvents()
    }

    previousMonth(): void {
        this.calendar.prev()
        this.retrieveEvents()
    }

    nextMonth(): void {
        this.calendar.next()
        this.retrieveEvents()
    }
}
</script>

<style scoped lang="scss"></style>
