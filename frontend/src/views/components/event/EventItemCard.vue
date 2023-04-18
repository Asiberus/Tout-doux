<template>
    <div>
        <v-hover v-slot="{ hover }">
            <v-card
                @click="openEventDialog()"
                :color="cardColor"
                :disabled="disabled"
                :ripple="ripple"
                class="rounded-lg"
                :class="{ 'cursor-default': !clickable, 'mb-3': marginBottom, caret }">
                <v-card-text class="d-flex align-center">
                    <v-icon v-if="showIcon" :class="[getTextColor('icon')]" large class="mr-4">
                        mdi-calendar-clock
                    </v-icon>

                    <template v-if="event.takesWholeDay">
                        <v-icon
                            title="Takes whole day"
                            class="mr-2"
                            :class="[getTextColor('icon')]">
                            mdi-white-balance-sunny
                        </v-icon>
                    </template>

                    <div class="flex-grow-1 d-flex flex-column overflow-hidden mr-4">
                        <div
                            class="d-flex align-center grey--text font-weight-bold"
                            :class="[getTextColor('date')]">
                            <template v-if="event.takesWholeDay && !daySelected">
                                <span title="Date">
                                    {{ dateFormat(event.startDate, 'DD/MM/YY') }}
                                </span>
                            </template>

                            <template v-if="!event.takesWholeDay">
                                <span title="Start date">
                                    <template
                                        v-if="
                                            !daySelected ||
                                            (event.endDate &&
                                                !isDateEqual(event.startDate, event.endDate))
                                        ">
                                        {{ dateFormat(event.startDate, 'DD/MM/YY') }}
                                    </template>
                                    <template v-if="event.startTime">
                                        {{ event.startTime }}
                                    </template>
                                </span>

                                <template v-if="event.endDate">
                                    <v-icon :class="[getTextColor('date')]" small class="mx-1">
                                        mdi-arrow-right
                                    </v-icon>
                                    <span title="End date">
                                        <template
                                            v-if="!isDateEqual(event.startDate, event.endDate)">
                                            {{ dateFormat(event.endDate, 'DD/MM/YY') }}
                                        </template>
                                        <template v-if="event.endTime">
                                            {{ event.endTime }}
                                        </template>
                                    </span>
                                </template>
                            </template>
                        </div>

                        <h3
                            class="text-ellipsis white--text"
                            :class="[getTextColor('name')]"
                            :title="event.name">
                            {{ event.name }}
                        </h3>

                        <span
                            v-if="event.description"
                            class="text-ellipsis"
                            :class="[getTextColor('description')]"
                            :title="event.description">
                            {{ event.description }}
                        </span>
                    </div>

                    <template v-if="project">
                        <router-link :to="{ name: 'project-detail', params: { id: project.id } }">
                            <ProjectAvatar :project="project" :hover="hover"></ProjectAvatar>
                        </router-link>
                    </template>
                </v-card-text>
            </v-card>
        </v-hover>

        <v-dialog v-model="eventDialog" width="60%">
            <EventDialog
                :event="event"
                :is-dialog-open="eventDialog"
                :related-to-date="relatedToDate"
                @submit="emitUpdateEvent"
                @delete="emitDeleteEvent"
                @close="eventDialog = false">
            </EventDialog>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import ProjectAvatar from '@/components/ProjectAvatar.vue'
import { EventModel, EventPostOrPatch } from '@/models/event.model'
import { Project } from '@/models/project.model'
import { Task } from '@/models/task.model'
import { dateFormat } from '@/pipes'
import { isPassed } from '@/utils/event.util'
import EventDialog from '@/views/components/event/EventDialog.vue'
import moment from 'moment'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({ components: { EventDialog, ProjectAvatar } })
export default class EventItemCard extends Vue {
    @Prop({ required: true }) event!: EventModel
    @Prop({ default: null }) project!: Project | null
    @Prop({ default: null }) color!: string | null
    @Prop({ default: true }) changePassedTextColor!: boolean
    @Prop({ default: false }) disabled!: boolean
    @Prop({ default: true }) clickable!: boolean
    @Prop({ default: true }) ripple!: boolean
    @Prop({ default: false }) daySelected!: boolean
    @Prop({ default: false }) showIcon!: boolean
    @Prop({ default: true }) caret!: boolean
    @Prop({ default: true }) marginBottom!: boolean
    @Prop({ required: false }) relatedToDate?: string

    eventDialog = false

    get cardColor(): string | null {
        if (this.color) return this.color
        if (isPassed(this.event)) return 'null'

        return 'event'
    }

    openEventDialog(): void {
        if (this.disabled || !this.clickable) return

        this.eventDialog = true
    }

    emitUpdateEvent(data: EventPostOrPatch): void {
        this.eventDialog = false
        this.$emit('update', { id: this.event.id, data })
    }

    emitDeleteEvent(): void {
        this.eventDialog = false
        this.$emit('delete', this.event.id)
    }

    getTextColor(section: 'icon' | 'date' | 'name' | 'description'): string {
        const colorConfig = {
            icon: 'white--text',
            date: 'grey--text text--lighten-3',
            name: 'white--text',
            description: 'grey-text text--lighten-2',
        }

        let color: string
        if (isPassed(this.event) && this.changePassedTextColor) color = 'grey--text'
        else color = colorConfig[section]

        if (this.project?.archived) color += ' opacity-60'
        return color
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
