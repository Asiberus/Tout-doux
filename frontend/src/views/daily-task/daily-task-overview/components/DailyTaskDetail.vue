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
                <template v-if="dailyTaskUncompleted">
                    You have {{ dailyTaskUncompleted }} tasks left to do today!
                </template>
                <template v-else> All tasks done for today ! </template>
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
                                    <h4 class="white--text font-weight-regular">
                                        {{ dailyTask.task.name }}
                                    </h4>
                                </template>
                                <template v-else>
                                    <h4 class="white--text font-weight-regular">
                                        {{ dailyTask.name }}
                                    </h4>
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
import { DailyTaskActionEnum, DailyTaskModel } from '@/models/daily-task.model'
import moment from 'moment'

@Component
export default class DailyTaskDetail extends Vue {
    @Prop() private date: string = ''
    private dailyTaskList: DailyTaskModel[] = []

    get dateFormatted(): string {
        return moment(this.date).format('dddd DD MMMM Y')
    }

    get dailyTaskUncompleted(): number {
        return this.dailyTaskList.filter((dailyTask: DailyTaskModel) => !dailyTask.completed).length
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

    private toggleDailyTaskCompleteState(dailyTask: DailyTaskModel): void {
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

    // Todo : move this function to a better place
    // Todo : define color for dailytask action chip
    private getLiteralFormOfDailyActionEnum(action: DailyTaskActionEnum): string | null {
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

    private getActionChipColor(action: DailyTaskActionEnum): string {
        switch (action) {
            case DailyTaskActionEnum.THINK:
                return 'teal'
            case DailyTaskActionEnum.WORK:
                return 'purple'
            case DailyTaskActionEnum.FINISH:
                return 'red'
        }
    }

    private emitDailyTaskCompletedEvent(): void {
        const numberOfDailyTaskCompleted = this.dailyTaskList.filter(
            (dailyTask: DailyTaskModel) => dailyTask.completed
        ).length
        this.$emit('dailyTaskCompleted', this.date, numberOfDailyTaskCompleted)
    }

    private closeDialog(): void {
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

.content {
    margin: 8rem;
    width: 60%;
}
</style>
