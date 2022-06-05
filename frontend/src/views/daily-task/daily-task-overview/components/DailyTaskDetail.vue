<template>
    <div class="wrapper">
        <div class="actions-wrapper">
            <v-btn @click="closeDialog" icon>
                <v-icon>mdi-close</v-icon>
            </v-btn>
        </div>
        <div class="content-wrapper">
            <div class="content">
                <h1 class="text-h2 mb-10">{{ dateFormat(date, 'dddd DD MMMM Y') }}</h1>
                <v-row class="pl-8">
                    <v-col
                        v-if="dailyTaskList.length > 0"
                        :cols="events.length > 0 ? 8 : 10"
                        class="d-flex flex-column">
                        <h3 class="text-h4">Tasks</h3>
                        <p class="grey--text text--lighten-1 ml-2">
                            <template v-if="isToday(date)">
                                <template v-if="numberOfDailyTaskUncompleted">
                                    You have {{ numberOfDailyTaskUncompleted }} tasks left to do
                                    today!
                                </template>
                                <template v-else>All tasks done for today !</template>
                            </template>
                            <template v-else>
                                <template
                                    v-if="numberOfDailyTaskCompleted === dailyTaskList.length">
                                    All tasks completed for that day! :)
                                </template>
                                <template v-else-if="numberOfDailyTaskCompleted > 0">
                                    {{ numberOfDailyTaskCompleted }} on {{ dailyTaskList.length }}
                                    {{ numberOfDailyTaskCompleted > 1 ? 'tasks' : 'task' }} were
                                    completed that day.
                                </template>
                                <template v-else> No tasks completed that day :(</template>
                            </template>
                        </p>
                        <div class="task-wrapper">
                            <v-timeline dense>
                                <v-timeline-item
                                    v-for="dailyTask in dailyTaskList"
                                    :key="dailyTask.id"
                                    fill-dot
                                    :color="dailyTask.completed ? 'green' : null"
                                    :icon="dailyTask.completed ? 'mdi-check' : 'mdi-trophy'">
                                    <v-card
                                        @click="toggleDailyTaskCompleteState(dailyTask)"
                                        :color="dailyTask.completed ? 'green darken-4' : null">
                                        <v-card-text class="white--text">
                                            <div class="d-flex align-center">
                                                <v-chip
                                                    v-if="dailyTask.action"
                                                    class="mr-3"
                                                    :color="getActionChipColor(dailyTask.action)">
                                                    {{
                                                        getLiteralFormOfDailyActionEnum(
                                                            dailyTask.action
                                                        )
                                                    }}
                                                </v-chip>
                                                <template v-if="dailyTask.task">
                                                    <h4 class="font-weight-regular mr-3">
                                                        {{ dailyTask.task.name }}
                                                    </h4>
                                                </template>
                                                <template v-else>
                                                    <h4
                                                        class="
                                                            white--text
                                                            font-weight-regular
                                                            mr-3
                                                        ">
                                                        {{ dailyTask.name }}
                                                    </h4>
                                                </template>

                                                <template v-if="dailyTask.task">
                                                    <v-chip
                                                        @click.stop=""
                                                        :ripple="false"
                                                        label
                                                        small
                                                        :color="getTagColor(dailyTask)"
                                                        class="daily-chip">
                                                        <template v-if="dailyTask.task.project">
                                                            <span
                                                                :title="
                                                                    'Project : ' +
                                                                    dailyTask.task.project.name
                                                                "
                                                                >{{
                                                                    dailyTask.task.project.name
                                                                }}</span
                                                            >
                                                        </template>
                                                        <template
                                                            v-else-if="dailyTask.task.section">
                                                            <span
                                                                :title="
                                                                    'Project : ' +
                                                                    dailyTask.task.section.project
                                                                        .name
                                                                "
                                                                >{{
                                                                    dailyTask.task.section.project
                                                                        .name
                                                                }}</span
                                                            >
                                                            <span class="mx-1">•</span>
                                                            <span
                                                                :title="
                                                                    'Section : ' +
                                                                    dailyTask.task.section.name
                                                                "
                                                                >{{
                                                                    dailyTask.task.section.name
                                                                }}</span
                                                            >
                                                        </template>
                                                        <template
                                                            v-else-if="dailyTask.task.collection">
                                                            <span
                                                                :title="
                                                                    'Collection : ' +
                                                                    dailyTask.task.collection.name
                                                                "
                                                                >{{
                                                                    dailyTask.task.collection.name
                                                                }}</span
                                                            >
                                                        </template>
                                                    </v-chip>
                                                </template>
                                            </div>
                                        </v-card-text>
                                    </v-card>
                                </v-timeline-item>
                            </v-timeline>
                        </div>
                    </v-col>
                    <v-col v-if="events.length > 0" :cols="dailyTaskList.length > 0 ? 4 : 8">
                        <h3 class="text-h4">Events</h3>
                        <p class="grey--text text--lighten-1 ml-2">
                            <template v-if="isToday(date)"
                                >You have {{ events.length }} events today!
                            </template>
                            <template v-else>You had {{ events.length }} events that day!</template>
                        </p>
                        <div class="event-wrapper">
                            <v-timeline dense>
                                <v-timeline-item
                                    v-for="event in events"
                                    :key="event.id"
                                    :color="isEventPassed(event) ? 'orange darken-2' : null"
                                    fill-dot
                                    icon="mdi-calendar-clock">
                                    <v-card
                                        :color="isEventPassed(event) ? 'orange darken-2' : null">
                                        <v-card-text class="white--text">
                                            <div class="d-flex align-center">
                                                <span
                                                    class="flex-grow-1 text-ellipsis pr-5"
                                                    :title="event.name">
                                                    {{ event.name }}
                                                </span>
                                                <v-tooltip
                                                    v-if="event.description"
                                                    bottom
                                                    max-width="20rem"
                                                    content-class="grey darken-3">
                                                    <template v-slot:activator="{ attrs, on }">
                                                        <v-icon
                                                            v-bind="attrs"
                                                            v-on="on"
                                                            class="mr-2">
                                                            mdi-text-box
                                                        </v-icon>
                                                    </template>
                                                    {{ event.description }}
                                                </v-tooltip>

                                                <v-icon
                                                    v-if="event.takes_whole_day"
                                                    class="mr-2"
                                                    title="Takes whole day">
                                                    mdi-white-balance-sunny
                                                </v-icon>

                                                <div
                                                    v-if="!event.takes_whole_day"
                                                    class="flex-shrink-0 d-flex">
                                                    <v-icon class="mr-2">
                                                        mdi-clock-outline
                                                    </v-icon>
                                                    <template
                                                        v-if="
                                                            !event.end_date ||
                                                            isDateEqual(
                                                                event.start_date,
                                                                event.end_date
                                                            )
                                                        ">
                                                        <span title="Start date">
                                                            {{
                                                                dateFormat(
                                                                    event.start_date,
                                                                    'HH:mm'
                                                                )
                                                            }}
                                                        </span>
                                                    </template>
                                                    <template v-else>
                                                        <div
                                                            class="d-flex flex-column"
                                                            title="Start date">
                                                            <span class="mb-n1">
                                                                {{
                                                                    dateFormat(
                                                                        event.start_date,
                                                                        'DD/MM'
                                                                    )
                                                                }}
                                                            </span>
                                                            <span>{{
                                                                dateFormat(
                                                                    event.start_date,
                                                                    'HH:mm'
                                                                )
                                                            }}</span>
                                                        </div>
                                                    </template>

                                                    <template v-if="event.end_date">
                                                        <v-icon small class="mx-2">
                                                            mdi-arrow-right
                                                        </v-icon>
                                                        <template
                                                            v-if="
                                                                isDateEqual(
                                                                    event.start_date,
                                                                    event.end_date
                                                                )
                                                            ">
                                                            <span title="End date">
                                                                {{
                                                                    dateFormat(
                                                                        event.end_date,
                                                                        'HH:mm'
                                                                    )
                                                                }}
                                                            </span>
                                                        </template>
                                                        <template v-else>
                                                            <div
                                                                class="d-flex flex-column"
                                                                title="End date">
                                                                <span class="mb-n1">
                                                                    {{
                                                                        dateFormat(
                                                                            event.end_date,
                                                                            'DD/MM'
                                                                        )
                                                                    }}
                                                                </span>
                                                                <span>{{
                                                                    dateFormat(
                                                                        event.end_date,
                                                                        'HH:mm'
                                                                    )
                                                                }}</span>
                                                            </div>
                                                        </template>
                                                    </template>
                                                </div>
                                            </div>
                                        </v-card-text>
                                    </v-card>
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
import { EventExtended, EventModel } from '@/models/event.model'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { dailyTaskService } from '@/api/daily-task.api'
import { DailyTaskActionEnum, DailyTask } from '@/models/daily-task.model'
import moment from 'moment'
import { eventService } from '@/api/event.api'
import { dateFormat } from '@/pipes'

@Component({ components: { EventItemCard } })
export default class DailyTaskDetail extends Vue {
    @Prop() date!: string
    dailyTaskList: DailyTask[] = []
    events: EventExtended[] = []

    get numberOfDailyTaskCompleted(): number {
        return this.dailyTaskList.filter(dailyTask => dailyTask.completed).length
    }

    get numberOfDailyTaskUncompleted(): number {
        return this.dailyTaskList.filter(dailyTask => !dailyTask.completed).length
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
            (response: any) => (this.events = response.body),
            (error: any) => console.error(error)
        )
    }

    toggleDailyTaskCompleteState(dailyTask: DailyTask): void {
        dailyTaskService.updateDailyTask(dailyTask.id, { completed: !dailyTask.completed }).then(
            (response: any) => {
                dailyTask.completed = response.body.completed
                this.emitDailyTaskCompletedEvent()
            },
            (error: any) => console.error(error)
        )
    }

    getTagColor(dailyTask: DailyTask): string | undefined {
        if (dailyTask.task) {
            if (dailyTask.task.project || dailyTask.task.section) return 'project'
            else if (dailyTask.task.collection) return 'collection'
        }
    }

    // Todo : move this function to a better place
    // Todo : define color for dailytask action chip
    getLiteralFormOfDailyActionEnum(action: DailyTaskActionEnum): string | null {
        switch (action) {
            case DailyTaskActionEnum.THINK:
                return 'Réfléchir'
            case DailyTaskActionEnum.WORK:
                return 'Travailler'
            case DailyTaskActionEnum.FINISH:
                return 'Finir'
            default:
                return null
        }
    }

    getActionChipColor(action: DailyTaskActionEnum): string {
        switch (action) {
            case DailyTaskActionEnum.THINK:
                return 'teal'
            case DailyTaskActionEnum.WORK:
                return 'purple'
            case DailyTaskActionEnum.FINISH:
                return 'red'
        }
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

    isToday(date: string): boolean {
        return moment().isSame(date, 'day')
    }

    isDateEqual(date1: string, date2: string): boolean {
        return moment(date1).isSame(date2, 'day')
    }

    isEventPassed(event: EventModel): boolean {
        const { start_date, end_date, takes_whole_day } = event
        if (end_date) return moment().isAfter(end_date)
        if (takes_whole_day) return moment().isAfter(start_date, 'day')
        return moment().isAfter(start_date)
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
            width: 80%;
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
                    top: 24px;
                }

                .v-timeline-item:last-child {
                    padding-bottom: 0;
                }
            }

            .v-card--link:focus::before {
                opacity: 0;
            }

            .daily-chip {
                cursor: default !important;

                span {
                    max-width: 5rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .chip-divider {
                    border-width: 1px;
                }
            }
        }
    }
}

.opacity-1 {
    opacity: 1 !important;
}
</style>
