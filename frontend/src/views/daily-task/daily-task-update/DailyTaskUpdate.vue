<template>
    <v-container>
        <h1 class="mb-6">
            <span class="grey--text">Update Daily Task : </span>{{ dateFormatted }}
        </h1>

        <v-row>
            <v-col cols="8">
                <DailyTaskUpdateProjectList
                    :projectList="projectList"
                    :dailyTaskList="dailyTaskList"
                    @selectTask="createDailyTask">
                </DailyTaskUpdateProjectList>

                <v-divider class="my-3"></v-divider>

                <DailyTaskUpdateCollectionList
                    :collectionList="collectionList"
                    :dailyTaskList="dailyTaskList"
                    @selectTask="createDailyTask">
                </DailyTaskUpdateCollectionList>
            </v-col>
            <v-col cols="4" class="daily-task-wrapper">
                <DailyTaskUpdateList
                    :dailyTaskList="dailyTaskList"
                    @createDailyTask="createDailyTask"
                    @updateDailyTask="updateDailyTask"
                    @deleteDailyTask="deleteDailyTask">
                </DailyTaskUpdateList>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import moment from 'moment'
import { DailyTaskProjectDisplayModel } from '@/models/project.model'
import { projectService } from '@/api/project.api'
import { collectionService } from '@/api/collection.api'
import { DailyTaskDisplayModel, DailyTaskModel } from '@/models/daily-task.model'
import { dailyTaskService } from '@/api/daily-task.api'
import DailyTaskUpdateProjectList from '@/views/daily-task/daily-task-update/components/DailyTaskUpdateProjectList.vue'
import { DailyTaskCollectionDisplayModel } from '@/models/collection.model'
import DailyTaskUpdateCollectionList from '@/views/daily-task/daily-task-update/components/DailyTaskUpdateCollectionList.vue'
import DailyTaskUpdateList from '@/views/daily-task/daily-task-update/components/DailyTaskUpdateList.vue'

@Component({
    components: {
        DailyTaskUpdateProjectList,
        DailyTaskUpdateCollectionList,
        DailyTaskUpdateList,
    },
})
export default class DailyTaskUpdate extends Vue {
    @Prop() private date!: string

    private dailyTaskList: DailyTaskDisplayModel[] = []
    private projectList: DailyTaskProjectDisplayModel[] = []
    private collectionList: DailyTaskCollectionDisplayModel[] = []

    get dateFormatted(): string {
        return moment(this.date).format('dddd DD MMMM Y')
    }

    created(): void {
        this.retrieveDailyTaskList()
        this.retrieveProjectList()
        this.retrieveCollectionList()
    }

    private retrieveDailyTaskList(): void {
        const date = moment().format('Y-MM-DD')
        dailyTaskService.getDailyTasksByDate(date).then(
            (response: any) => {
                this.dailyTaskList = response.body.content
                this.dailyTaskList.forEach((dailyTask: DailyTaskDisplayModel) => {
                    this.$set(dailyTask, 'editMode', false)
                })
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    private retrieveProjectList(): void {
        projectService.getProjectList({ archived: false }).then(
            (response: any) => {
                this.projectList = response.body.content
                this.projectList.forEach((project: DailyTaskProjectDisplayModel) => {
                    this.$set(project, 'selected', false)
                })
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    private retrieveCollectionList(): void {
        collectionService.getCollectionList().then(
            (response: any) => {
                this.collectionList = response.body.content
                this.collectionList.forEach((collection: DailyTaskCollectionDisplayModel) => {
                    this.$set(collection, 'selected', false)
                })
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    // private createDailyTaskByForm(): void {
    //   dailyTaskService.createDailyTask(this.dailyTaskForm.data).then(
    //       (response: any) => {
    //         this.$set(this.dailyTaskList, this.dailyTaskList.length - 1, Object.assign({editMode: false}, response.body));
    //         this.createDailyTaskDisplayed = false;
    //       }, (error: any) => {
    //         console.error(error);
    //       }
    //   )
    // }

    private createDailyTask(dailyTask: Partial<DailyTaskModel>): void {
        dailyTaskService.createDailyTask(dailyTask).then(
            (response: any) => {
                this.dailyTaskList.push(response.body)
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    private updateDailyTask(dailyTaskId: number, dailyTaskForm: Partial<DailyTaskModel>): void {
        dailyTaskService.updateDailyTask(dailyTaskId, dailyTaskForm).then(
            (response: any) => {
                const dailyTask = this.dailyTaskList.find(
                    (dailyTask: DailyTaskDisplayModel) => dailyTask.id === response.body.id
                )
                Object.assign(dailyTask, response.body, { editMode: false })
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    private deleteDailyTask(dailyTaskId: number): void {
        dailyTaskService.deleteDailyTask(dailyTaskId).then(
            () => {
                const dailyTaskIndex = this.dailyTaskList.findIndex(
                    (dailyTask: DailyTaskDisplayModel) => dailyTask.id === dailyTaskId
                )
                if (dailyTaskIndex !== -1) {
                    this.dailyTaskList.splice(dailyTaskIndex, 1)
                }
            },
            (error: any) => {
                console.error(error)
            }
        )
    }
}
</script>

<style scoped lang="scss"></style>
