<template>
    <div class="flex-grow-1 d-flex flex-column">
        <div class="d-flex flex-column flex-sm-row align-stretch column-gap-2 row-gap-1 mb-3">
            <h3 class="text-h6 text-sm-h5 flex-grow-1">Events related to the project</h3>

            <div class="d-flex justify-space-between align-center gap-2">
                <FilterChip
                    v-if="project.events.length > 0"
                    v-model="displayPassedEvent"
                    color="event"
                    icon="mdi-clock-check-outline">
                    Passed
                </FilterChip>

                <v-dialog
                    v-model="eventDialog"
                    :width="getDialogWidth()"
                    :fullscreen="$vuetify.breakpoint.smAndDown">
                    <template #activator="{ on, attrs }">
                        <v-btn
                            v-bind="attrs"
                            v-on="on"
                            :disabled="project.archived"
                            :block="$vuetify.breakpoint.xsOnly && project.events.length === 0">
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
        </div>

        <template v-if="!displayPassedEvent">
            <template v-if="comingEvents.length > 0">
                <div class="pl-3">
                    <EventItemCard
                        v-for="event of comingEvents"
                        :key="event.id"
                        :event="event"
                        :disabled="project.archived"
                        :show-icon="true"
                        @update="updateEvent($event)"
                        @delete="deleteEvent($event)">
                    </EventItemCard>
                </div>
            </template>
            <template v-else>
                <EmptyListDisplay
                    message="This project has no coming events."
                    class="empty-list-display">
                    <template #img>
                        <img
                            src="../../../../assets/no_events.svg"
                            alt="No events"
                            class="empty-list-display__img" />
                    </template>
                </EmptyListDisplay>
            </template>
        </template>
        <template v-else>
            <template v-if="passedEvents.length > 0">
                <div class="pl-3">
                    <EventItemCard
                        v-for="event of passedEvents"
                        :key="event.id"
                        :event="event"
                        :show-icon="true"
                        :disabled="project.archived"
                        @update="updateEvent($event)"
                        @delete="deleteEvent($event)">
                    </EventItemCard>
                </div>
            </template>
            <template v-else>
                <EmptyListDisplay
                    message="This project has no past events."
                    class="empty-list-display">
                    <template #img>
                        <img
                            src="../../../../assets/no_events.svg"
                            alt="No events"
                            class="empty-list-display__img" />
                    </template>
                </EmptyListDisplay>
            </template>
        </template>
    </div>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import { EventModel, EventPostOrPatch } from '@/models/event.model'
import { ProjectDetail } from '@/models/project.model'
import { projectActions } from '@/store/modules/project.store'
import { isPassed } from '@/utils/event.utils'
import EventDialog from '@/views/components/event/EventDialog.vue'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import { Component, Vue } from 'vue-property-decorator'
import { getDialogWidth } from '@/utils/dialog.utils'

@Component({
    methods: { getDialogWidth },
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

    createEvent(event: EventPostOrPatch): void {
        this.eventDialog = false
        event.projectId = this.project.id
        this.$store.dispatch(projectActions.event.addEvent, event)
    }

    updateEvent(payload: { id: number; data: EventPostOrPatch }): void {
        this.$store.dispatch(projectActions.event.editEvent, payload)
    }

    deleteEvent(id: number): void {
        this.$store.dispatch(projectActions.event.deleteEvent, id)
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.empty-list-display {
    padding-top: 20px;
    flex-grow: 1;

    &__img {
        width: clamp(200px, 50%, 300px);

        @media #{map-get($display-breakpoints, 'xl-only')} {
            width: clamp(200px, 50%, 400px);
        }
    }
}
</style>
