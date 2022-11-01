<template>
    <div>
        <v-row>
            <v-col cols="10">
                <div class="d-flex align-center mb-5">
                    <h3 class="flex-grow-1">Event related to the project</h3>

                    <v-chip
                        class="mr-3"
                        :color="displayPassedEvent ? 'orange lighten-1' : 'grey darken-4'"
                        @click="displayPassedEvent = !displayPassedEvent">
                        <v-icon small class="mr-1"> mdi-clock-check-outline </v-icon>
                        Passed
                    </v-chip>

                    <v-dialog v-model="eventDialog" width="60%">
                        <template #activator="{ on, attrs }">
                            <v-btn v-bind="attrs" v-on="on" :disabled="project.archived">
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
                <template v-if="!displayPassedEvent">
                    <template v-if="comingEvents.length > 0">
                        <EventItemCard
                            v-for="event of comingEvents"
                            :key="event.id"
                            :event="event"
                            :disabled="project.archived"
                            @update="updateEvent"
                            @delete="deleteEvent">
                        </EventItemCard>
                    </template>
                    <template v-else>
                        <EmptyListDisplay message="This project has no coming events">
                            <template #img>
                                <img
                                    src="../../../../assets/no_events.svg"
                                    width="300"
                                    alt="No events" />
                            </template>
                        </EmptyListDisplay>
                    </template>
                </template>
                <template v-else>
                    <template v-if="passedEvents.length > 0">
                        <EventItemCard
                            v-for="event of passedEvents"
                            :key="event.id"
                            :event="event"
                            :disabled="project.archived"
                            @update="updateEvent"
                            @delete="deleteEvent">
                        </EventItemCard>
                    </template>
                    <template v-else>
                        <EmptyListDisplay message="This project has no coming events">
                            <template #img>
                                <img
                                    src="../../../../assets/no_events.svg"
                                    width="300"
                                    alt="No events" />
                            </template>
                        </EmptyListDisplay>
                    </template>
                </template>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { projectActions } from '@/store/modules/project.store'
import moment from 'moment'
import { Component, Vue } from 'vue-property-decorator'
import { ProjectTask } from '@/models/project.model'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import { EventModel } from '@/models/event.model'
import EventDialog from '@/views/components/event/EventDialog.vue'

@Component({
    components: { EventDialog, EventItemCard, EmptyListDisplay },
})
export default class ProjectEvent extends Vue {
    eventDialog = false
    displayPassedEvent = false

    get project(): ProjectTask {
        return this.$store.state.project.currentProject
    }

    get comingEvents(): EventModel[] {
        return this.project.events.filter(({ start_date, end_date, takes_whole_day }) => {
            if (end_date) return moment().isSameOrBefore(end_date)
            if (takes_whole_day) return moment().isSameOrBefore(start_date, 'day')
            return moment().isSameOrBefore(start_date)
        })
    }

    get passedEvents(): EventModel[] {
        return this.project.events
            .filter(({ start_date, end_date, takes_whole_day }) => {
                if (end_date) return moment().isAfter(end_date)
                if (takes_whole_day) return moment().isAfter(start_date, 'day')
                return moment().isAfter(start_date)
            })
            .reverse()
    }

    createEvent(event: Partial<EventModel>): void {
        this.eventDialog = false
        event.projectId = this.project.id
        this.$store.dispatch(projectActions.event.addEvent, event)
    }

    updateEvent(payload: { id: number; data: Partial<EventModel> }): void {
        this.$store.dispatch(projectActions.event.editEvent, payload)
    }

    deleteEvent(id: number): void {
        this.$store.dispatch(projectActions.event.deleteEvent, id)
    }
}
</script>

<style scoped lang="scss"></style>
