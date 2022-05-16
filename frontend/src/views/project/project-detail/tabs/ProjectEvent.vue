<template>
    <div>
        <v-row>
            <v-col cols="10">
                <div class="d-flex align-center mb-5">
                    <h3 class="flex-grow-1">Event related to the project</h3>
                    <div>
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
                </div>
                <template v-if="project.events.length > 0">
                    <EventItemCard
                        v-for="event of events"
                        :key="event.id"
                        :event="event"
                        :disabled="project.archived"
                        @update="updateEvent"
                        @delete="deleteEvent">
                    </EventItemCard>
                </template>
                <template v-else>
                    <EmptyListDisplay message="This project has no events">
                        <template #img>
                            <img
                                src="../../../../assets/no_events.svg"
                                width="300"
                                alt="No events" />
                        </template>
                    </EmptyListDisplay>
                </template>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { projectActions } from '@/store/modules/project.store'
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

    get project(): ProjectTask {
        return this.$store.state.project.currentProject
    }

    get events(): EventModel[] {
        return this.project.events
    }

    createEvent(event: Partial<EventModel>): void {
        this.eventDialog = false
        event.projectId = this.project.id
        this.$store.dispatch(projectActions.event.addEvent, event)
    }

    updateEvent(id: number, data: Partial<EventModel>): void {
        this.$store.dispatch(projectActions.event.editEvent, { id, data })
    }

    deleteEvent(id: number): void {
        this.$store.dispatch(projectActions.event.deleteEvent, id)
    }
}
</script>

<style scoped lang="scss"></style>
