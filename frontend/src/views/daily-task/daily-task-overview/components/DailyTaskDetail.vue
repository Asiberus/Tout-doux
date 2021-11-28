<template>
    <div class="wrapper">
        <div class="actions-wrapper">
            <v-btn @click="closeDialog" icon>
                <v-icon>mdi-close</v-icon>
            </v-btn>
        </div>
        <div class="content">
            <h1>{{ dateFormatted }}</h1>
            <p class="grey--text text--lighten-1 ml-2">
                <template v-if="isToday">
                    <template v-if="numberOfDailyTaskUncompleted">
                        You have {{ numberOfDailyTaskUncompleted }} tasks left to do today!
                    </template>
                    <template v-else>All tasks done for today !</template>
                </template>
                <template v-else>
                    <template v-if="numberOfDailyTaskCompleted === dailyTaskList.length">
                        All tasks completed for that day! :)
                    </template>
                    <template v-else-if="numberOfDailyTaskCompleted > 0">
                        {{ numberOfDailyTaskCompleted }} on {{ dailyTaskList.length }}
                        {{ numberOfDailyTaskCompleted > 1 ? 'tasks' : 'task' }} were completed that
                        day.
                    </template>
                    <template v-else> No tasks completed that day :( </template>
                </template>
            </p>
            <v-timeline dense>
                <v-timeline-item
                    v-for="dailyTask in dailyTaskList"
                    :key="dailyTask.id"
                    fill-dot
                    :color="dailyTask.completed ? 'green' : 'grey'"
                    :icon="dailyTask.completed ? 'mdi-check' : 'mdi-trophy'">
                    <v-card
                        @click="toggleDailyTaskCompleteState(dailyTask)"
                        :color="dailyTask.completed ? 'green darken-4' : null">
                        <v-card-text>
                            <div class="d-flex align-center">
                                <v-chip
                                    v-if="dailyTask.action"
                                    class="mr-3"
                                    :color="getActionChipColor(dailyTask.action)">
                                    {{ getLiteralFormOfDailyActionEnum(dailyTask.action) }}
                                </v-chip>
                                <template v-if="dailyTask.taskId">
                                    <h4 class="white--text font-weight-regular mr-3">
                                        {{ dailyTask.task.name }}
                                    </h4>
                                </template>
                                <template v-else>
                                    <h4 class="white--text font-weight-regular mr-3">
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
                                                :title="'Project : ' + dailyTask.task.project.name"
                                                >{{ dailyTask.task.project.name }}</span
                                            >
                                        </template>
                                        <template v-else-if="dailyTask.task.section">
                                            <span
                                                :title="
                                                    'Project : ' +
                                                    dailyTask.task.section.project.name
                                                "
                                                >{{ dailyTask.task.section.project.name }}</span
                                            >
                                            <span class="mx-1">•</span>
                                            <span
                                                :title="'Section : ' + dailyTask.task.section.name"
                                                >{{ dailyTask.task.section.name }}</span
                                            >
                                        </template>
                                        <template v-else-if="dailyTask.task.collection">
                                            <span
                                                :title="
                                                    'Collection : ' + dailyTask.task.collection.name
                                                "
                                                >{{ dailyTask.task.collection.name }}</span
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
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { dailyTaskService } from '@/api/daily-task.api'
import { DailyTaskActionEnum, DailyTask, DailyTaskDisplay } from '@/models/daily-task.model'
import moment from 'moment'

@Component
export default class DailyTaskDetail extends Vue {
    @Prop() date!: string
    dailyTaskList: DailyTask[] = []

    get isToday(): boolean {
        return moment().isSame(this.date, 'days')
    }

    get dateFormatted(): string {
        return moment(this.date).format('dddd DD MMMM Y')
    }

    get numberOfDailyTaskCompleted(): number {
        return this.dailyTaskList.filter(dailyTask => dailyTask.completed).length
    }

    get numberOfDailyTaskUncompleted(): number {
        return this.dailyTaskList.filter(dailyTask => !dailyTask.completed).length
    }

    @Watch('date', { immediate: true })
    private onDateChanges(): void {
        this.retrieveDailyTaskList()
    }

    private retrieveDailyTaskList(): void {
        dailyTaskService.getDailyTasksByDate(this.date).then(
            (response: any) => {
                this.dailyTaskList = response.body.content
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    toggleDailyTaskCompleteState(dailyTask: DailyTask): void {
        dailyTaskService.updateDailyTask(dailyTask.id, { completed: !dailyTask.completed }).then(
            (response: any) => {
                dailyTask.completed = response.body.completed
                this.emitDailyTaskCompletedEvent()
            },
            (error: any) => {
                console.error(error)
            }
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
}
</script>

<style scoped lang="scss">
.wrapper {
    display: flex;
    justify-content: center;
    height: 100%;
    background-color: #0a0a0a;
}

.actions-wrapper {
    position: absolute;
    top: 0;
    right: 0;
    padding: 1rem;
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

.content {
    margin: 8rem;
    width: 60%;
}
</style>
