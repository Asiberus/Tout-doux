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
                :event-color="getEventColor"
                event-start="start_date"
                event-end="end_date"
                :event-more="true"
                :event-margin-bottom="2"
                event-overlap-mode="column"
                :hide-header="false"
                :weekdays="weekdays"
                color="accent"
                first-interval="8"
                @click:event="selectEvent($event)">
                <!--                        <template v-slot:day="{ past, date }">{{ date }}</template>-->
                <template v-slot:day-label="{ day, present }">
                    <span :class="{ 'accent--text text--lighten-1': present }">{{ day }}</span>
                </template>
                <template v-slot:event="{ event }">
                    <div class="pl-2">
                        {{ event.name }}
                    </div>
                </template>
                <!--                        <template v-slot:day-month>LALAL</template>-->
                <!--                        <template v-slot:day-label>LALAL</template>-->
            </v-calendar>
            <v-menu
                v-model="eventTooltip"
                :close-on-content-click="false"
                :activator="elementSelected"
                :key="eventTooltipKey"
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
    events: EventExtended[] = []

    value = moment().format('YYYY-MM-DD')
    weekdays = [1, 2, 3, 4, 5, 6, 0]

    eventDialog = false
    eventToUpdate: EventExtended | null = null

    eventTooltip = false
    eventTooltipKey = 0
    eventSelected: EventExtended | null = null
    elementSelected: EventTarget | null = null

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

    updateEvent({ id, event }: { id: number; event: Partial<EventModel> }): void {
        eventService.updateEventById(id, event, { extended: true }).then(
            (response: any) => {
                const eventIndex = this.events.findIndex(e => e.id === id)
                if (eventIndex === -1) return

                this.events.splice(eventIndex, 1, this.parseEvent(response.body))
                this.eventSelected = null
                this.eventDialog = false
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
                this.eventSelected = null
                this.eventDialog = false
            },
            (error: any) => console.error(error)
        )
    }

    selectEvent($event: { nativeEvent: Event; event: EventExtended }): void {
        const { nativeEvent, event } = $event
        this.eventTooltipKey += 1 // Hack to reload v-menu component
        this.eventSelected = event
        this.elementSelected = nativeEvent.target
        if (!this.eventTooltip) this.eventTooltip = true
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
        if (!project) return 'teal'
        else if (project.archived) return 'accent'
        else return 'project'
    }
}
</script>

<style scoped lang="scss"></style>
