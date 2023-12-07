<template>
    <div class="fill-height d-flex flex-column">
        <MainTitle icon="mdi-calendar-month" class="mb-2 mb-sm-3">Agenda</MainTitle>

        <div class="d-flex align-center flex-wrap gap-1 mb-2 mb-sm-3">
            <div class="mr-sm-1">
                <v-btn
                    @click="previousMonth()"
                    icon
                    :small="$vuetify.breakpoint.xsOnly && true"
                    :x-small="false">
                    <v-icon>mdi-chevron-left</v-icon>
                </v-btn>
                <v-btn @click="nextMonth()" icon :small="$vuetify.breakpoint.xsOnly && true">
                    <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
            </div>

            <v-btn
                @click="setCalendarToNow()"
                :disabled="isCurrentMonthSelected"
                :small="$vuetify.breakpoint.xsOnly"
                class="mr-1">
                now
            </v-btn>

            <h4 class="text-body-1 text-sm-h5 flex-grow-1">{{ monthSelected }}</h4>

            <v-btn @click="openEventDialog()" :small="$vuetify.breakpoint.xsOnly">
                <v-icon>mdi-plus</v-icon>
                <template v-if="$vuetify.breakpoint.smAndUp">event</template>
            </v-btn>
        </div>

        <v-sheet rounded min-height="500px" height="75svh">
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
                class="calendar"
                @click:day="handleClickOnDay($event)">
                <template #day-label="{ day, present, date }">
                    <v-hover v-slot="{ hover }">
                        <div
                            class="day-label"
                            :class="{
                                'accent--text': present,
                                'grey--text text--lighten-1': !hover,
                                'white--text': hover,
                                'text--lighten-3': present && hover,
                            }">
                            {{ day }}
                        </div>
                    </v-hover>
                </template>
                <template #event="{ event }">
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

                        <span class="ml-1 text-truncate" :title="event.name">{{ event.name }}</span>
                    </div>
                </template>
            </v-calendar>
            <!-- The Tooltip menu is removed temporally. See if we keep it or not. -->
            <v-menu
                v-model="eventTooltip"
                :close-on-content-click="false"
                :activator="eventTooltipElement"
                :key="'event-info-' + eventTooltipKey"
                offset-x
                min-width="30rem"
                max-width="40rem">
                <template v-if="eventSelected">
                    <EventTooltip
                        :event="eventSelected"
                        @update="openEventDialog({ event: $event })">
                    </EventTooltip>
                </template>
            </v-menu>
        </v-sheet>

        <v-dialog
            v-model="eventDialog"
            :width="getDialogWidth()"
            :fullscreen="$vuetify.breakpoint.smAndDown">
            <EventDialog
                :is-dialog-open="eventDialog"
                :event="eventToUpdate"
                :start-date-placeholder="startDatePlaceholder"
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
            @open-event-dialog="openEventDialog({ startDatePlaceholder: $event })"
            @update="updateEvent($event)"
            @delete="deleteEvent($event)">
        </EventDayDialog>
    </div>
</template>

<script lang="ts">
import { eventService } from '@/api/event.api'
import { EventModel, EventPostOrPatch } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import { isEventRelatedToDate, sortEvents } from '@/utils/event.utils'
import EventDayDialog from '@/views/components/event/EventDayDialog.vue'
import EventDialog from '@/views/components/event/EventDialog.vue'
import EventTooltip from '@/views/components/event/EventTooltip.vue'
import moment from 'moment'
import { Component, Vue } from 'vue-property-decorator'
import MainTitle from '@/components/MainTitle.vue'
import { getDialogWidth } from '@/utils/dialog.utils'

@Component({
    methods: { getDialogWidth },
    components: { MainTitle, EventDialog, EventTooltip, EventDayDialog },
})
export default class Agenda extends Vue {
    events: EventModel[] = [] // TODO : think of using Set

    value = moment().format('YYYY-MM-DD')
    weekdays = [1, 2, 3, 4, 5, 6, 0]

    eventDialog = false
    eventToUpdate: EventModel | null = null
    startDatePlaceholder: string | null = null

    eventTooltip = false
    eventTooltipKey = 0
    eventSelected: EventModel | null = null
    eventTooltipElement: EventTarget | null = null

    eventDayDialog = false
    eventDayDialogDate: string | null = null
    eventDayDialogEvents: EventModel[] = []

    doubleClickTimer?: number = undefined

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

    openEventDialog(options: { event?: EventModel; startDatePlaceholder?: string } = {}): void {
        const { event, startDatePlaceholder } = options
        this.eventToUpdate = event ?? null
        this.startDatePlaceholder = startDatePlaceholder ?? null
        this.eventDialog = true
    }

    createEvent(event: EventPostOrPatch): void {
        this.eventSelected = null
        eventService.createEvent(event, { extended: true }).then(
            (response: any) => {
                this.events.push(response.body)
                this.eventDialog = false
                if (this.eventDayDialog) this.setDayDialogEventList()
            },
            (error: any) => console.error(error)
        )
    }

    updateEvent({ id, data }: { id: number; data: EventPostOrPatch }): void {
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

    // Tooltip removed temporally
    openEventTooltip($event: { nativeEvent: MouseEvent; event: EventModel }): void {
        const { nativeEvent, event } = $event

        nativeEvent.stopImmediatePropagation()
        this.eventTooltipKey += 1 // Hack to re-render v-menu component
        this.eventSelected = event
        this.eventTooltipElement = nativeEvent.target
        if (!this.eventTooltip) this.eventTooltip = true
    }

    handleClickOnDay($event: { date: string }): void {
        const { date } = $event
        const delay = 200

        if (this.doubleClickTimer) {
            clearTimeout(this.doubleClickTimer)
            this.doubleClickTimer = undefined
            this.openEventDialog({ startDatePlaceholder: date })
        } else {
            this.doubleClickTimer = setTimeout(() => {
                this.openDayDialog(date)
                this.doubleClickTimer = undefined
            }, delay)
        }
    }

    openDayDialog(date: string): void {
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
.calendar {
    &::v-deep .v-calendar-weekly__day {
        cursor: pointer;

        .v-event {
            pointer-events: none;
        }

        .v-event-more {
            background-color: inherit;
        }

        &:hover {
            background-color: #424242;
        }

        &.v-present {
            background-color: #515151;
        }

        &.v-outside {
            &:hover {
                background-color: #303030;
            }
        }
    }

    .day-label {
        width: 100%;
        height: 100%;
        cursor: pointer;
    }

    .calendar-arrow {
        margin-left: 1px;
        margin-right: 1px;
    }
}
</style>
