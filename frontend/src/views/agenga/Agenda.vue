<template>
    <div>
        <h1 class="flex-grow-1 text-h3 mb-5">Agenda</h1>
        <div class="d-flex align-center mb-2">
            <v-btn icon class="mx-2" @click="previousMonth()">
                <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
            {{ monthSelected }}
            <v-btn icon class="mx-2" @click="nextMonth()">
                <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
            <v-btn @click="setCalendarToNow()">now</v-btn>
            <v-spacer></v-spacer>
            <v-btn @click="openEventDialog()">
                <v-icon left>mdi-plus</v-icon>
                event
            </v-btn>
        </div>

        <v-sheet rounded height="640">
            <v-calendar
                ref="calendar"
                v-model="value"
                :events="events"
                :weekdays="weekdays"
                :event-color="getEventColor"
                event-start="start_date"
                event-end="end_date"
                :event-margin-bottom="2"
                :event-ripple="false"
                color="accent"
                @click:event="selectEvent($event)"
                @click:more="openDayDialog($event)">
                <template v-slot:day-label="{ day, present }">
                    <span :class="{ 'accent--text text--lighten-1': present }">{{ day }}</span>
                </template>
                <template v-slot:event="{ event, eventParsed }">
                    <div class="d-flex px-2">
                        <template v-if="event.takes_whole_day">
                            <v-icon x-small>mdi-white-balance-sunny</v-icon>
                        </template>
                        <template
                            v-else-if="eventParsed.startIdentifier === eventParsed.endIdentifier">
                            <span class="font-weight-bold">{{ eventParsed.start.time }}</span>
                            <template
                                v-if="
                                    eventParsed.startTimestampIdentifier !==
                                    eventParsed.endTimestampIdentifier
                                ">
                                <v-icon x-small>mdi-arrow-right</v-icon>
                                <span class="font-weight-bold">{{ eventParsed.end.time }}</span>
                            </template>
                        </template>
                        <template v-else>
                            <span class="font-weight-bold">
                                {{ dateFormat(eventParsed.start.date, 'DD/MM') }}
                            </span>
                            <v-icon x-small>mdi-arrow-right</v-icon>
                            <span class="font-weight-bold">
                                {{ dateFormat(eventParsed.end.date, 'DD/MM') }}
                            </span>
                        </template>

                        <span class="ml-1 text-ellipsis">{{ event.name }}</span>
                    </div>
                </template>
            </v-calendar>
            <v-menu
                v-model="eventTooltip"
                :close-on-content-click="false"
                :activator="eventTooltipElement"
                :key="'event-info-' + eventTooltipKey"
                offset-x
                min-width="30rem"
                max-width="40rem">
                <template v-if="eventSelected">
                    <EventTooltip :event="eventSelected" @update="openEventDialog($event)">
                    </EventTooltip>
                </template>
            </v-menu>
        </v-sheet>

        <v-dialog v-model="eventDialog" width="60%">
            <EventDialog
                :is-dialog-open="eventDialog"
                :event="eventToUpdate"
                @create="createEvent($event)"
                @update="updateEvent($event)"
                @delete="deleteEvent($event)"
                @close="eventDialog = false">
            </EventDialog>
        </v-dialog>

        <EventDayDialog
            v-model="eventDayDialog"
            :date="eventDayDialogDate"
            :events="eventDayDialogEvents"
            @update="updateEvent($event)"
            @delete="deleteEvent($event)">
        </EventDayDialog>
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
import EventDayDialog from '@/views/components/event/EventDayDialog.vue'

@Component({
    components: { EventDialog, EventTooltip, EventDayDialog },
})
export default class Agenda extends Vue {
    events: EventExtended[] = [] // TODO : think of using Set

    value = moment().format('YYYY-MM-DD')
    weekdays = [1, 2, 3, 4, 5, 6, 0]

    eventDialog = false
    eventToUpdate: EventExtended | null = null

    eventTooltip = false
    eventTooltipKey = 0
    eventSelected: EventExtended | null = null
    eventTooltipElement: EventTarget | null = null

    eventDayDialog = false
    eventDayDialogDate: string | null = null
    eventDayDialogEvents: EventExtended[] = []

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
            (error: any) => console.error(error)
        )
    }

    // Parse start and end date
    parseEvent(event: EventExtended): EventExtended {
        return {
            ...event,
            start_date: dateFormat(event.start_date, 'YYYY-MM-DD HH:mm'),
            end_date: event.end_date ? dateFormat(event.end_date, 'YYYY-MM-DD HH:mm') : undefined,
        }
    }

    openEventDialog(event: EventExtended | null = null): void {
        this.eventToUpdate = event
        this.eventDialog = true
    }

    createEvent(event: Partial<EventModel>): void {
        this.eventSelected = null
        eventService.createEvent(event, { extended: true }).then(
            (response: any) => {
                this.events.push(this.parseEvent(response.body))
                this.eventDialog = false
            },
            (error: any) => console.error(error)
        )
    }

    updateEvent({ id, data }: { id: number; data: Partial<EventModel> }): void {
        eventService.updateEventById(id, data, { extended: true }).then(
            (response: any) => {
                const eventIndex = this.events.findIndex(e => e.id === id)
                if (eventIndex === -1) return

                this.events.splice(eventIndex, 1, this.parseEvent(response.body))

                if (this.eventDayDialog) this.setDayDialogEvents()
                else this.eventDialog = false
            },
            (error: any) => console.error(error)
        )
    }

    deleteEvent(id: number): void {
        eventService.deleteEventById(id).then(
            () => {
                const eventIndex = this.events.findIndex(event => event.id === id)
                if (eventIndex === -1) return

                this.events.splice(eventIndex, 1)

                if (this.eventDayDialog) this.setDayDialogEvents()
                else this.eventDialog = false
            },
            (error: any) => console.error(error)
        )
    }

    selectEvent($event: { nativeEvent: MouseEvent; event: EventExtended }): void {
        const { nativeEvent, event } = $event
        this.eventTooltipKey += 1 // Hack to reload v-menu component
        this.eventSelected = event
        this.eventTooltipElement = nativeEvent.target
        if (!this.eventTooltip) this.eventTooltip = true
    }

    openDayDialog($event: { date: string; nativeEvent: MouseEvent }): void {
        const { date } = $event
        this.eventDayDialog = true
        this.eventDayDialogDate = date
        this.setDayDialogEvents()
    }

    // TODO : See if this can be optimized
    setDayDialogEvents(): void {
        this.eventDayDialogEvents = this.events.filter(({ start_date, end_date }) => {
            if (!end_date) return moment(this.eventDayDialogDate).isSame(start_date, 'day')
            return moment(this.eventDayDialogDate).isBetween(start_date, end_date, 'day', '[]')
        })
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

    getEventColor(event: EventExtended): string {
        const { project } = event
        if (project) return 'project'
        return 'teal'
    }

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }
}
</script>

<style scoped lang="scss"></style>
