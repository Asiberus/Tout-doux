<template>
    <div class="fill-height d-flex flex-column">
        <h3 class="text-h3 mb-5">Agenda</h3>
        <div class="d-flex align-center mb-2">
            <v-btn @click="setCalendarToNow()" :disabled="isCurrentMonthSelected" class="mr-2">
                now
            </v-btn>
            <v-btn icon @click="previousMonth()">
                <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
            <v-btn icon class="mr-2" @click="nextMonth()">
                <v-icon>mdi-chevron-right</v-icon>
            </v-btn>

            <h4 class="text-h5">{{ monthSelected }}</h4>

            <v-spacer></v-spacer>
            <v-btn @click="openEventDialog()">
                <v-icon left>mdi-plus</v-icon>
                event
            </v-btn>
        </div>

        <v-sheet rounded class="flex-grow-1" min-height="500px">
            <v-calendar
                ref="calendar"
                v-model="value"
                :events="events"
                :weekdays="weekdays"
                event-color="event"
                event-start="startDate"
                event-end="endDate"
                :event-margin-bottom="2"
                :event-ripple="false"
                color="accent"
                @click:event="openEventTooltip($event)"
                @click:more="openDayDialog($event)">
                <template v-slot:day-label="{ day, present, date }">
                    <v-hover v-slot="{ hover }">
                        <div
                            class="day-label"
                            :class="{
                                'accent--text': present,
                                'grey--text text--lighten-1': !hover,
                                'white--text': hover,
                                'text--lighten-3': present && hover,
                            }"
                            @click="openDayDialog({ date })">
                            {{ day }}
                        </div>
                    </v-hover>
                </template>
                <template v-slot:event="{ event }">
                    <div class="d-flex align-center px-2">
                        <template v-if="event.project">
                            <v-avatar
                                :color="event.project.archived ? 'projectArchived' : 'project'"
                                size="10"
                                class="mr-1">
                            </v-avatar>
                        </template>

                        <template v-if="event.takesWholeDay">
                            <v-icon x-small>mdi-white-balance-sunny</v-icon>
                        </template>
                        <template v-else>
                            <template v-if="event.startDate === event.endDate">
                                <span class="font-weight-bold">{{ event.startTime }}</span>
                                <v-icon x-small class="calendar-arrow">mdi-arrow-right</v-icon>
                                <span class="font-weight-bold">{{ event.endTime }}</span>
                            </template>
                            <template v-else-if="event.endDate">
                                <span class="font-weight-bold">
                                    {{ dateFormat(event.startDate, 'DD/MM') }}
                                </span>
                                <v-icon x-small class="calendar-arrow">mdi-arrow-right</v-icon>
                                <span class="font-weight-bold">
                                    {{ dateFormat(event.endDate, 'DD/MM') }}
                                </span>
                            </template>
                            <template v-else-if="event.startTime">
                                <span class="font-weight-bold">{{ event.startTime }}</span>
                            </template>
                        </template>

                        <span class="ml-1 text-ellipsis" :title="event.name">{{ event.name }}</span>
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
import { isEventRelatedToDate, sortEvents } from '@/utils/event.util'
import EventDayDialog from '@/views/components/event/EventDayDialog.vue'
import EventDialog from '@/views/components/event/EventDialog.vue'
import EventTooltip from '@/views/components/event/EventTooltip.vue'
import moment from 'moment'
import { Component, Vue } from 'vue-property-decorator'

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

    get isCurrentMonthSelected(): boolean {
        return moment(this.value).isSame(moment(), 'month')
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
            (response: any) => (this.events = response.body),
            (error: any) => console.error(error)
        )
    }

    openEventDialog(event: EventExtended | null = null): void {
        this.eventToUpdate = event
        this.eventDialog = true
    }

    createEvent(event: Partial<EventModel>): void {
        this.eventSelected = null
        eventService.createEvent(event, { extended: true }).then(
            (response: any) => {
                this.events.push(response.body)
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

                const updatedEvent = response.body
                this.events.splice(eventIndex, 1, updatedEvent)
                if (this.eventSelected?.id === updatedEvent.id) this.eventSelected = updatedEvent
                if (this.eventDayDialog) this.setDayDialogEventList()
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

                if (this.eventDayDialog) this.setDayDialogEventList({ sort: false })
                else this.eventDialog = false
            },
            (error: any) => console.error(error)
        )
    }

    openEventTooltip($event: { nativeEvent: MouseEvent; event: EventExtended }): void {
        const { nativeEvent, event } = $event
        this.eventTooltipKey += 1 // Hack to re-render v-menu component
        this.eventSelected = event
        this.eventTooltipElement = nativeEvent.target
        if (!this.eventTooltip) this.eventTooltip = true
    }

    openDayDialog($event: { date: string }): void {
        const { date } = $event
        this.eventDayDialog = true
        this.eventDayDialogDate = date
        this.setDayDialogEventList()
    }

    // TODO : See if this can be optimized
    private setDayDialogEventList(options: { sort: boolean } = { sort: true }): void {
        if (!this.eventDayDialogDate) return

        this.eventDayDialogEvents = this.events.filter(
            event => isEventRelatedToDate(event, <string>this.eventDayDialogDate) // We have tested that date is not null before
        )
        if (options.sort)
            this.eventDayDialogEvents.sort((event1, event2) => sortEvents(event1, event2))
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

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }
}
</script>

<style scoped lang="scss">
.calendar-arrow {
    margin-left: 1px;
    margin-right: 1px;
}

.day-label {
    width: 100%;
    height: 100%;
    cursor: pointer;
}
</style>
