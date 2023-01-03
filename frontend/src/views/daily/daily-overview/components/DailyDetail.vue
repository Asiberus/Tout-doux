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
                        <p class="grey--text text--lighten-1 ml-2">
                            <template v-if="isToday">
                                <template v-if="numberOfDailyTaskUncompleted">
                                    You have {{ numberOfDailyTaskUncompleted }}
                                    {{ numberOfDailyTaskUncompleted > 1 ? 'tasks' : 'task' }} left
                                    to do today!
                                </template>
                                <template v-else>All tasks done for today! :)</template>
                            </template>
                            <template v-else>
                                <template
                                    v-if="numberOfDailyTaskCompleted === dailyTaskList.length">
                                    All tasks completed for that day! :)
                                </template>
                                <template v-else-if="numberOfDailyTaskCompleted > 0">
                                    {{ numberOfDailyTaskCompleted }} on {{ dailyTaskList.length }}
                                    {{ dailyTaskList.length > 1 ? 'tasks' : 'task' }} were completed
                                    that day.
                                </template>
                                <template v-else> No tasks completed that day :(</template>
                            </template>
                        </p>
                        <div class="task-wrapper">
                            <v-timeline dense>
                                <v-timeline-item
                                    v-for="dailyTask in dailyTaskList"
                                    :key="`task-${dailyTask.id}`"
                                    fill-dot
                                    :color="dailyTask.completed ? 'green' : null"
                                    :icon="dailyTask.completed ? 'mdi-check' : 'mdi-trophy'">
                                    <v-card
                                        @click="toggleDailyTaskCompleteState(dailyTask)"
                                        :color="dailyTask.completed ? 'green darken-4' : null">
                                        <v-card-text class="white--text">
                                            <div class="task-content">
                                                <v-chip
                                                    v-if="dailyTask.action"
                                                    :color="getActionChipColor(dailyTask.action)"
                                                    class="task-content__action">
                                                    {{
                                                        getLiteralFormOfDailyActionEnum(
                                                            dailyTask.action
                                                        )
                                                    }}
                                                </v-chip>
                                                <template v-if="dailyTask.task">
                                                    <h4 class="task-content__name">
                                                        {{ dailyTask.task.name }}
                                                    </h4>
                                                </template>
                                                <template v-else>
                                                    <h4 class="task-content__name">
                                                        {{ dailyTask.name }}
                                                    </h4>
                                                </template>

                                                <template v-if="dailyTask.task">
                                                    <ProjectChip
                                                        v-if="dailyTask.task.project"
                                                        :project="dailyTask.task.project"
                                                        @click.native.stop
                                                        class="task-content__chip">
                                                    </ProjectChip>
                                                    <SectionChip
                                                        v-if="dailyTask.task.section"
                                                        :section="dailyTask.task.section"
                                                        @click.native.stop
                                                        class="task-content__chip">
                                                    </SectionChip>
                                                    <CollectionChip
                                                        v-if="dailyTask.task.collection"
                                                        :collection="dailyTask.task.collection"
                                                        @click.native.stop
                                                        class="task-content__chip">
                                                    </CollectionChip>
                                                </template>
                                            </div>
                                        </v-card-text>
                                    </v-card>
                                </v-timeline-item>
                            </v-timeline>
                        </div>
                    </v-col>
                    <v-col v-if="events.length > 0" :cols="dailyTaskList.length > 0 ? 5 : 8">
                        <h4 class="text-h4">Events</h4>
                        <p class="grey--text text--lighten-1 ml-2">
                            <template v-if="isToday">
                                You have {{ events.length }}
                                {{ events.length > 1 ? 'events' : 'event' }} today!
                            </template>
                            <template v-else>
                                You had {{ events.length }}
                                {{ events.length > 1 ? 'events' : 'event' }} that day!
                            </template>
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
import CollectionChip from '@/components/CollectionChip.vue'
import ProjectChip from '@/components/ProjectChip.vue'
import SectionChip from '@/components/SectionChip.vue'
import { DailyTask, DailyTaskActionEnum } from '@/models/daily-task.model'
import { EventExtended } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import { isPassed, sortEvents } from '@/utils/event.util'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import moment from 'moment'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component({ components: { EventItemCard, ProjectChip, SectionChip, CollectionChip } })
export default class DailyDetail extends Vue {
    @Prop() date!: string
    dailyTaskList: DailyTask[] = []
    events: EventExtended[] = []

    get numberOfDailyTaskCompleted(): number {
        return this.dailyTaskList.filter(dailyTask => dailyTask.completed).length
    }

    get numberOfDailyTaskUncompleted(): number {
        return this.dailyTaskList.filter(dailyTask => !dailyTask.completed).length
    }

    get isToday(): boolean {
        return moment().isSame(this.date, 'day')
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
                (this.events = response.body.sort((a: EventExtended, b: EventExtended) =>
                    sortEvents(a, b, { handlePassedEvent: true })
                )),
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

    isEventPassed(event: EventExtended): boolean {
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

                .task-content {
                    display: flex;
                    align-items: center;
                    column-gap: 1rem;

                    &__action {
                        flex-shrink: 0;
                    }

                    &__name {
                        flex-shrink: 0;
                    }

                    &__chip {
                        max-width: 15rem;
                    }
                }
            }
        }
    }
}

.opacity-1 {
    opacity: 1 !important;
}
</style>
