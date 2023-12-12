<template>
    <v-dialog
        :value="dialogState"
        @input="setDialogStateTo($event)"
        fullscreen
        hide-overlay
        content-class="daily-detail-dialog"
        transition="dialog-bottom-transition">
        <div
            class="content pa-4 pa-sm-6 pt-6 pt-sm-8 pt-md-12 pr-8"
            v-touch="{
                start: touchStartEvent,
                left: () => switchTab('left'),
                right: () => switchTab('right'),
                down: scrollDownEvent,
            }">
            <div class="actions-wrapper">
                <v-btn @click="setDialogStateTo(false)" icon>
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>

            <div class="d-flex align-center gap-2 mb-2 mb-sm-3 mb-md-5 mb-lg-10">
                <h1 class="text-h4 text-sm-h3 text-md-h2">
                    {{ dateFormat(date, 'dddd DD MMMM Y') }}
                </h1>
                <v-hover v-slot="{ hover }" v-if="isToday">
                    <v-btn
                        :to="{ name: 'daily-update', params: { date, step: 'task' } }"
                        icon
                        :large="$vuetify.breakpoint.smAndUp"
                        :small="$vuetify.breakpoint.xsOnly"
                        :color="hover ? 'grey lighten-1' : 'grey darken-3'"
                        class="ml-1"
                        title="Edit day">
                        <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                </v-hover>
            </div>

            <template v-if="$vuetify.breakpoint.mdAndDown">
                <template v-if="dailyTaskList.length > 0 && events.length > 0">
                    <!-- Tabs -->
                    <v-tabs v-model="tab" background-color="transparent" color="accent" grow>
                        <v-tab tab-value="task">Tasks</v-tab>
                        <v-tab tab-value="event">Events</v-tab>
                    </v-tabs>

                    <v-tabs-items v-model="tab" touchless class="transparent py-2 pa-sm-2 pa-md-4">
                        <v-tab-item value="task">
                            <DailyDetailTaskTimeline
                                :daily-task-list="dailyTaskList"
                                :date="date"
                                @toggle-daily-task="toggleDailyTask($event)">
                            </DailyDetailTaskTimeline>
                        </v-tab-item>
                        <v-tab-item value="event">
                            <DailyDetailEventTimeline :events="events" :date="date">
                            </DailyDetailEventTimeline>
                        </v-tab-item>
                    </v-tabs-items>
                </template>
                <template v-else-if="dailyTaskList.length > 0">
                    <!-- Only tasks -->
                    <div class="overflow-auto">
                        <DailyDetailTaskTimeline
                            :daily-task-list="dailyTaskList"
                            :date="date"
                            @toggle-daily-task="toggleDailyTask($event)">
                        </DailyDetailTaskTimeline>
                    </div>
                </template>
                <template v-else-if="events.length > 0">
                    <!-- Only events -->
                    <DailyDetailEventTimeline :events="events" :date="date">
                    </DailyDetailEventTimeline>
                </template>
            </template>
            <template v-else>
                <!-- Tasks and events -->
                <v-row class="pl-4">
                    <v-col v-if="dailyTaskList.length > 0" :cols="events.length > 0 ? 7 : 8">
                        <DailyDetailTaskTimeline
                            :daily-task-list="dailyTaskList"
                            :date="date"
                            @toggle-daily-task="toggleDailyTask($event)">
                        </DailyDetailTaskTimeline>
                    </v-col>

                    <v-col v-if="events.length > 0" :cols="dailyTaskList.length > 0 ? 5 : 8">
                        <DailyDetailEventTimeline :events="events" :date="date">
                        </DailyDetailEventTimeline>
                    </v-col>
                </v-row>
            </template>
        </div>
    </v-dialog>
</template>

<script lang="ts">
import { dailyTaskService } from '@/api/daily-task.api'
import { eventService } from '@/api/event.api'
import { DailyTask } from '@/models/daily-task.model'
import { EventModel } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import { sortEvents } from '@/utils/event.utils'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import moment from 'moment'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import DailyTaskCard from '@/views/daily/components/DailyTaskCard.vue'
import DailyDetailTaskTimeline from '@/views/daily/daily-summary/components/DailyDetailTaskTimeline.vue'
import DailyDetailEventTimeline from '@/views/daily/daily-summary/components/DailyDetailEventTimeline.vue'
import { hideScroll, showScroll } from '@/utils/document.utils'

@Component({
    components: { DailyDetailEventTimeline, DailyDetailTaskTimeline, DailyTaskCard, EventItemCard },
})
export default class DailyDetail extends Vue {
    @Prop({ default: false }) value!: boolean
    @Prop({ required: true }) date!: string

    dialogState = false
    dailyTaskList: DailyTask[] = []
    events: EventModel[] = []

    tab: 'task' | 'event' = 'task'
    isScrollingOnContent = false

    get numberOfDailyTaskCompleted(): number {
        return this.dailyTaskList.filter(dailyTask => dailyTask.completed).length
    }

    get isToday(): boolean {
        return moment().isSame(this.date, 'day')
    }

    @Watch('value')
    private onDialogOpening(value: boolean): void {
        this.dialogState = value
        this.tab = 'task'

        if (value) hideScroll()
        else showScroll()
    }

    @Watch('date', { immediate: false })
    private onDateChanges(): void {
        this.retrieveDailyTaskList()
        this.retrieveTodayEvents()
    }

    private retrieveDailyTaskList(): void {
        dailyTaskService.getDailyTasksByDate(this.date).then(
            (response: any) => (this.dailyTaskList = response.body.content),
            (error: any) => console.error(error)
        )
    }

    private retrieveTodayEvents(): void {
        eventService.getEvents({ date: this.date }).then(
            (response: any) =>
                (this.events = response.body.sort((a: EventModel, b: EventModel) =>
                    sortEvents(a, b, { handlePassedEvent: true })
                )),
            (error: any) => console.error(error)
        )
    }

    touchStartEvent() {
        // We detect if the touch-down is a scroll on the content
        const scrollableElement = document.querySelector('.v-dialog')
        this.isScrollingOnContent = scrollableElement.scrollTop > 0
    }

    scrollDownEvent(): void {
        if (!this.isScrollingOnContent) this.setDialogStateTo(false)
    }

    switchTab(direction: 'right' | 'left'): void {
        if (
            !this.$vuetify.breakpoint.mdAndDown ||
            this.dailyTaskList.length === 0 ||
            this.events.length === 0
        )
            return

        if (direction === 'right') this.tab = 'task'
        else if (direction === 'left') this.tab = 'event'
    }

    setDialogStateTo(value: boolean): void {
        this.dialogState = value
        this.$emit('input', value)
    }

    toggleDailyTask(dailyTask: DailyTask): void {
        dailyTaskService.updateDailyTask(dailyTask.id, { completed: !dailyTask.completed }).then(
            (response: any) => {
                dailyTask.completed = response.body.completed
                this.emitDailyTaskCompletedEvent()
            },
            (error: any) => console.error(error)
        )
    }

    emitDailyTaskCompletedEvent(): void {
        this.$emit('daily-task-completed', this.date, this.numberOfDailyTaskCompleted)
    }

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.content {
    flex-grow: 1;
}

.actions-wrapper {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
    padding: 1rem;

    @media #{map-get($display-breakpoints, 'xs-only')} {
        padding: 0.5rem;
    }
}
</style>
