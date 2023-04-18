<template>
    <div class="wrapper">
        <div class="actions-wrapper">
            <v-btn @click="closeDialog" icon>
                <v-icon>mdi-close</v-icon>
            </v-btn>
        </div>
        <div class="content-wrapper">
            <div class="content">
                <h1 class="text-h2 mb-10">
                    {{ dateFormat(date, 'dddd DD MMMM Y') }}
                    <v-hover v-slot="{ hover }" v-if="isToday">
                        <v-btn
                            :to="{ name: 'daily-update', params: { date, step: 'task' } }"
                            icon
                            large
                            :color="hover ? 'grey lighten-1' : 'grey darken-3'"
                            class="ml-1"
                            title="Edit day">
                            <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                    </v-hover>
                </h1>
                <v-row class="pl-8">
                    <v-col
                        v-if="dailyTaskList.length > 0"
                        :cols="events.length > 0 ? 7 : 8"
                        class="d-flex flex-column">
                        <h4 class="text-h4">Tasks</h4>
                        <p class="text-subtitle-1 grey--text text--lighten-1 ml-2">
                            {{ taskText }}
                        </p>
                        <div class="task-wrapper">
                            <v-timeline dense>
                                <v-timeline-item
                                    v-for="dailyTask in dailyTaskList"
                                    :key="`daily-task-${dailyTask.id}`"
                                    fill-dot
                                    :color="dailyTask.completed ? 'green darken-2' : null">
                                    <template #icon>
                                        <div
                                            v-ripple
                                            @click="toggleDailyTask(dailyTask)"
                                            class="icon-wrapper">
                                            <v-icon v-if="dailyTask.completed">mdi-check</v-icon>
                                            <v-icon v-else>mdi-trophy</v-icon>
                                        </div>
                                    </template>
                                    <DailyTaskCard
                                        :daily-task="dailyTask"
                                        @toggle="toggleDailyTask(dailyTask)"></DailyTaskCard>
                                </v-timeline-item>
                            </v-timeline>
                        </div>
                    </v-col>

                    <v-col v-if="events.length > 0" :cols="dailyTaskList.length > 0 ? 5 : 8">
                        <h4 class="text-h4">Events</h4>
                        <p class="text-subtitle-1 grey--text text--lighten-1 ml-2">
                            {{ eventText }}
                        </p>
                        <div class="event-wrapper">
                            <v-timeline dense>
                                <v-timeline-item
                                    v-for="event of events"
                                    :key="`event-${event.id}`"
                                    :color="isEventPassed(event) ? null : 'event'"
                                    :icon="
                                        isEventPassed(event) ? 'mdi-check' : 'mdi-calendar-clock'
                                    "
                                    :icon-color="isEventPassed(event) ? 'grey' : 'white'"
                                    fill-dot>
                                    <EventItemCard
                                        :event="event"
                                        :project="event.project"
                                        :day-selected="true"
                                        :clickable="false"
                                        :margin-bottom="false">
                                    </EventItemCard>
                                </v-timeline-item>
                            </v-timeline>
                        </div>
                    </v-col>
                </v-row>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { dailyTaskService } from '@/api/daily-task.api'
import { eventService } from '@/api/event.api'
import { DailyTask } from '@/models/daily-task.model'
import { EventModel } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import { isPassed, sortEvents } from '@/utils/event.util'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import moment from 'moment'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import DailyTaskCard from '@/views/daily/components/DailyTaskCard.vue'

@Component({
    components: { DailyTaskCard, EventItemCard },
})
export default class DailyDetail extends Vue {
    @Prop() date!: string
    dailyTaskList: DailyTask[] = []
    events: EventModel[] = []

    get numberOfDailyTaskCompleted(): number {
        return this.dailyTaskList.filter(dailyTask => dailyTask.completed).length
    }

    get numberOfDailyTaskUncompleted(): number {
        return this.dailyTaskList.filter(dailyTask => !dailyTask.completed).length
    }

    get isToday(): boolean {
        return moment().isSame(this.date, 'day')
    }

    get taskText(): string {
        if (this.isToday) {
            if (this.numberOfDailyTaskUncompleted > 0)
                return `You have ${this.numberOfDailyTaskUncompleted} ${
                    this.numberOfDailyTaskUncompleted > 1 ? 'tasks' : 'task'
                } left to do today!`
            else return 'All tasks done for today! :)'
        } else {
            if (this.numberOfDailyTaskUncompleted === this.dailyTaskList.length)
                return 'All tasks completed for that day! :)'
            else if (this.numberOfDailyTaskCompleted > 0)
                return `${this.numberOfDailyTaskCompleted} on ${this.dailyTaskList.length} tasks were completed that day`
            else return 'No tasks completed that day :('
        }
    }

    get eventText(): string {
        if (this.isToday)
            return `You have ${this.events.length} ${
                this.events.length > 1 ? 'events' : 'event'
            } today !`
        else
            return `You had ${this.events.length} ${
                this.events.length > 1 ? 'events' : 'event'
            } that day !`
    }

    @Watch('date', { immediate: true })
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

    closeDialog(): void {
        this.$emit('close')
    }

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }

    isEventPassed(event: EventModel): boolean {
        return isPassed(event)
    }
}
</script>

<style scoped lang="scss">
.wrapper {
    height: 100%;
    background-color: #0a0a0a;

    .actions-wrapper {
        position: absolute;
        top: 0;
        right: 0;
        padding: 1rem;
        z-index: 1;
    }

    .content-wrapper {
        display: flex;
        justify-content: center;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;

        .content {
            width: 90%;
            margin-top: 3rem;

            .task-wrapper,
            .event-wrapper {
                max-height: 70vh;
                overflow: auto;
            }

            .v-timeline {
                overflow: hidden;
                padding-top: 0;

                &::before {
                    top: 30px;
                    height: calc(100% - 60px);
                }

                .v-timeline-item:last-child {
                    padding-bottom: 0;
                }

                .icon-wrapper {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
            }
        }
    }
}
</style>
