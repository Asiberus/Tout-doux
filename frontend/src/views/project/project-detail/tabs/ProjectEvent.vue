<template>
    <div>
        <v-row>
            <v-col cols="12">
                <div class="d-flex align-center mb-5">
                    <h3 class="flex-grow-1">Event related to the project</h3>

                    <FilterChip
                        v-if="project.events.length > 0"
                        v-model="displayPassedEvent"
                        color="event"
                        icon="mdi-clock-check-outline"
                        class="mr-3">
                        Passed
                    </FilterChip>

                    <v-dialog v-model="eventDialog" width="60%">
                        <template #activator="{ on, attrs }">
                            <v-btn v-bind="attrs" v-on="on" :disabled="project.archived">
                                <v-icon left>mdi-plus</v-icon>
                                event
                            </v-btn>
                        </template>
                        <EventDialog
                            :is-dialog-open="eventDialog"
                            @submit="createEvent($event)"
                            @close="eventDialog = false">
                        </EventDialog>
                    </v-dialog>
                </div>
                <div class="pl-3">
                    <template v-if="!displayPassedEvent">
                        <template v-if="comingEvents.length > 0">
                            <EventItemCard
                                v-for="event of comingEvents"
                                :key="event.id"
                                :event="event"
                                :disabled="project.archived"
                                :show-icon="true"
                                @update="updateEvent($event)"
                                @delete="deleteEvent($event)">
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
                                :show-icon="true"
                                :disabled="project.archived"
                                @update="updateEvent($event)"
                                @delete="deleteEvent($event)">
                            </EventItemCard>
                        </template>
                        <template v-else>
                            <EmptyListDisplay message="This project has no past events">
                                <template #img>
                                    <img
                                        src="../../../../assets/no_events.svg"
                                        width="300"
                                        alt="No events" />
                                </template>
                            </EmptyListDisplay>
                        </template>
                    </template>
                </div>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import { EventModel } from '@/models/event.model'
import { ProjectDetail } from '@/models/project.model'
import { projectActions } from '@/store/modules/project.store'
import { isPassed } from '@/utils/event.util'
import EventDialog from '@/views/components/event/EventDialog.vue'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import { Component, Vue } from 'vue-property-decorator'

@Component({
    components: { EventDialog, EventItemCard, EmptyListDisplay, FilterChip },
})
export default class ProjectEvent extends Vue {
    eventDialog = false
    displayPassedEvent = false

    get project(): ProjectDetail {
        return this.$store.state.project.currentProject
    }

    get comingEvents(): EventModel[] {
        return this.project.events.filter(event => !isPassed(event))
    }

    get passedEvents(): EventModel[] {
        return this.project.events.filter(event => isPassed(event)).reverse()
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
