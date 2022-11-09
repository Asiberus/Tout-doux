<template>
    <div>
        <v-card
            @click="openEventDialog()"
            :color="cardColor"
            :disabled="disabled"
            :class="{ 'cursor-default': !clickable, 'mb-3': marginBottom, caret }">
            <v-card-text class="d-flex align-center pa-5 white--text">
                <v-icon class="mr-2">mdi-calendar-clock</v-icon>
                <h3 class="text-ellipsis font-weight-regular mr-2" :title="event.name">
                    {{ event.name }}
                </h3>

                <template v-if="project">
                    <ProjectChip :project="project" class="mr-2"></ProjectChip>
                </template>

                <v-spacer></v-spacer>

                <template v-if="event.description">
                    <v-tooltip bottom max-width="20rem" content-class="grey darken-3">
                        <template v-slot:activator="{ attrs, on }">
                            <v-icon v-bind="attrs" v-on="on" class="mr-2"> mdi-text-box </v-icon>
                        </template>
                        {{ event.description }}
                    </v-tooltip>
                </template>

                <div class="flex-shrink-0 d-flex align-center">
                    <template v-if="event.takes_whole_day">
                        <v-icon title="Takes whole day">mdi-white-balance-sunny</v-icon>
                        <span v-if="!daySelected" class="ml-2" title="Start Date">
                            {{ dateFormat(event.start_date, 'D MMMM Y') }}
                        </span>
                    </template>
                    <template v-else>
                        <v-icon class="mr-1">mdi-clock-outline</v-icon>
                        <template
                            v-if="
                                daySelected &&
                                (!event.end_date || isDateEqual(event.start_date, event.end_date))
                            ">
                            <span title="Start date">
                                {{ dateFormat(event.start_date, 'HH:mm') }}
                            </span>
                        </template>
                        <template v-else-if="compact">
                            <div class="d-flex flex-column ml-1" title="Start date">
                                <span class="mb-n1">
                                    {{ dateFormat(event.start_date, 'DD/MM') }}
                                </span>
                                <span>{{ dateFormat(event.start_date, 'HH:mm') }}</span>
                            </div>
                        </template>
                        <template v-else>
                            <span title="Start Date">
                                {{ dateFormat(event.start_date, 'D MMMM Y HH:mm') }}
                            </span>
                        </template>

                        <template v-if="event.end_date">
                            <v-icon small class="mx-1">mdi-arrow-right</v-icon>
                            <template
                                v-if="daySelected && isDateEqual(event.start_date, event.end_date)">
                                <span title="End date">
                                    {{ dateFormat(event.end_date, 'HH:mm') }}
                                </span>
                            </template>
                            <template v-else-if="compact">
                                <div class="d-flex flex-column" title="End date">
                                    <span class="mb-n1">
                                        {{ dateFormat(event.end_date, 'DD/MM') }}
                                    </span>
                                    <span>{{ dateFormat(event.end_date, 'HH:mm') }}</span>
                                </div>
                            </template>
                            <template v-else>
                                <span title="End Date">
                                    {{ dateFormat(event.end_date, 'D MMMM Y HH:mm') }}
                                </span>
                            </template>
                        </template>
                    </template>
                </div>
            </v-card-text>
        </v-card>

        <v-dialog v-model="eventDialog" width="60%">
            <EventDialog
                :event="event"
                :is-dialog-open="eventDialog"
                @submit="emitUpdateEvent"
                @delete="emitDeleteEvent"
                @close="eventDialog = false"></EventDialog>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import ProjectChip from '@/components/ProjectChip.vue'
import { EventModel } from '@/models/event.model'
import { Task } from '@/models/task.model'
import EventDialog from '@/views/components/event/EventDialog.vue'
import moment from 'moment'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Project } from '@/models/project.model'
import { dateFormat } from '@/pipes'

@Component({ components: { EventDialog, ProjectChip } })
export default class EventItemCard extends Vue {
    @Prop({ required: true }) event!: EventModel
    @Prop({ default: null }) project!: Project | null
    @Prop({ default: null }) color!: string | null
    @Prop({ default: false }) disabled!: boolean
    @Prop({ default: true }) clickable!: boolean
    @Prop({ default: false }) daySelected!: boolean
    @Prop({ default: false }) compact!: boolean
    @Prop({ default: true }) ripple!: boolean
    @Prop({ default: false }) caret!: boolean
    @Prop({ default: true }) marginBottom!: boolean

    eventDialog = false

    get isPassed(): boolean {
        if (this.event.end_date) return moment().isAfter(this.event.end_date)
        if (this.event.takes_whole_day) return moment().isAfter(this.event.start_date, 'day')
        return moment().isAfter(this.event.start_date)
    }

    get cardColor(): string | null {
        if (this.color) return this.color
        if (this.isPassed) return 'orange darken-2'

        return null
    }

    openEventDialog(): void {
        if (this.disabled || !this.clickable) return

        this.eventDialog = true
    }

    emitUpdateEvent(data: Partial<Task>): void {
        this.eventDialog = false
        this.$emit('update', { id: this.event.id, data })
    }

    emitDeleteEvent(): void {
        this.eventDialog = false
        this.$emit('delete', this.event.id)
    }

    isDateEqual(date1: string, date2: string): boolean {
        return moment(date1).isSame(date2, 'day')
    }

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }
}
</script>

<style scoped lang="scss">
.caret::after {
    content: '';
    position: absolute;
    top: calc(50% - 10px);
    left: -10px;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-right: 10px solid #000;
    border-right-color: inherit;
}
</style>
