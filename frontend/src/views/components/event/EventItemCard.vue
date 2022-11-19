<template>
    <div>
        <v-hover v-slot="{ hover }">
            <v-card
                @click="openEventDialog()"
                :color="cardColor"
                :disabled="disabled"
                :ripple="ripple"
                :class="{ 'cursor-default': !clickable, 'mb-3': marginBottom, caret }">
                <v-card-text class="d-flex align-center">
                    <v-icon v-if="showIcon" :class="[getTextColor('icon')]" large class="mr-4">
                        mdi-calendar-clock
                    </v-icon>

                    <template v-if="event.takes_whole_day">
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
                            <template v-if="event.takes_whole_day && !daySelected">
                                <span title="Date">
                                    {{ dateFormat(event.start_date, 'DD/MM/YY') }}
                                </span>
                            </template>
                            <template v-if="!event.takes_whole_day">
                                <span title="Start date">
                                    <template
                                        v-if="
                                            daySelected &&
                                            (!event.end_date ||
                                                isDateEqual(event.start_date, event.end_date))
                                        ">
                                        {{ dateFormat(event.start_date, 'HH:mm') }}
                                    </template>
                                    <template v-else>
                                        {{ dateFormat(event.start_date, 'DD/MM/YY HH:mm') }}
                                    </template>
                                </span>

                                <template v-if="event.end_date">
                                    <v-icon :class="[getTextColor('date')]" small class="mx-1">
                                        mdi-arrow-right
                                    </v-icon>
                                    <span title="End date">
                                        <template
                                            v-if="isDateEqual(event.start_date, event.end_date)">
                                            {{ dateFormat(event.end_date, 'HH:mm') }}
                                        </template>
                                        <template v-else>
                                            {{ dateFormat(event.end_date, 'DD/MM/YY HH:mm') }}
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
                @submit="emitUpdateEvent"
                @delete="emitDeleteEvent"
                @close="eventDialog = false"></EventDialog>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import ProjectAvatar from '@/components/ProjectAvatar.vue'
import ProjectChip from '@/components/ProjectChip.vue'
import { EventModel } from '@/models/event.model'
import { Project } from '@/models/project.model'
import { Task } from '@/models/task.model'
import { dateFormat } from '@/pipes'
import EventDialog from '@/views/components/event/EventDialog.vue'
import moment from 'moment'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({ components: { EventDialog, ProjectChip, ProjectAvatar } })
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
        if (this.isPassed) return 'null'

        return 'teal'
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

    getTextColor(section: 'icon' | 'date' | 'name' | 'description'): string {
        const colorConfig = {
            icon: 'white--text',
            date: 'grey--text text--lighten-3',
            name: 'white--text',
            description: 'grey-text text--lighten-2',
        }

        let color: string
        if (this.isPassed && this.changePassedTextColor) color = 'grey--text'
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
