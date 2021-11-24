<template>
    <v-container>
        <h1 class="mb-6">
            <span class="grey--text">Update Daily Task : </span>{{ dateFormatted }}
        </h1>

        <v-row>
            <v-col cols="8">
                <v-tabs v-model="updateTab" background-color="transparent" class="mb-3">
                    <v-tab>Project</v-tab>
                    <v-tab>Collection</v-tab>
                </v-tabs>
                <v-tabs-items v-model="updateTab" class="transparent">
                    <v-tab-item :transition="false" class="tab-wrapper">
                        <template v-if="projectList.length">
                            <v-row align-content="start" no-gutters class="position-relative">
                                <v-col
                                    v-for="project in projectList"
                                    :key="'project-' + project.content.id"
                                    cols="4">
                                    <DailyTaskUpdateProjectListItem
                                        :project="project.content"
                                        :daily-task-list="dailyTaskList"
                                        :selected.sync="project.selected"
                                        @select-task="createDailyTask"
                                        @unselect="project.selected = false">
                                    </DailyTaskUpdateProjectListItem>
                                </v-col>
                            </v-row>
                        </template>
                        <template v-else>
                            <EmptyListDisplay message="No projects available">
                                <template #img>
                                    <img
                                        src="../../../assets/project.svg"
                                        alt="No Project"
                                        height="250" />
                                </template>
                            </EmptyListDisplay>
                        </template>
                    </v-tab-item>
                    <v-tab-item :transition="false" class="tab-wrapper">
                        <!--                        <DailyTaskUpdateCollectionList-->
                        <!--                                :collectionList="collectionList"-->
                        <!--                                :dailyTaskList="dailyTaskList"-->
                        <!--                                @selectTask="createDailyTask">-->
                        <!--                        </DailyTaskUpdateCollectionList>-->
                    </v-tab-item>
                </v-tabs-items>
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
import { collectionService } from '@/api/collection.api'
import { dailyTaskService } from '@/api/daily-task.api'
import { projectService } from '@/api/project.api'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { DailyTaskCollectionDisplayModel } from '@/models/collection.model'
import {
    DailyTaskDisplayModel,
    DailyTaskDisplayWrapper,
    DailyTaskModel,
} from '@/models/daily-task.model'
import { ProjectModel } from '@/models/project.model'
import DailyTaskUpdateCollectionList from '@/views/daily-task/daily-task-update/components/DailyTaskUpdateCollectionList.vue'
import DailyTaskUpdateList from '@/views/daily-task/daily-task-update/components/DailyTaskUpdateList.vue'
import DailyTaskUpdateProjectListItem from '@/views/daily-task/daily-task-update/components/DailyTaskUpdateProjectListItem.vue'
import moment from 'moment'
import { Component, Prop, Vue } from 'vue-property-decorator'

// Todo : add btn to create project in no project svg
@Component({
    components: {
        DailyTaskUpdateProjectListItem,
        DailyTaskUpdateCollectionList,
        DailyTaskUpdateList,
        EmptyListDisplay,
    },
})
export default class DailyTaskUpdate extends Vue {
    @Prop() private date!: string

    dailyTaskList: DailyTaskDisplayModel[] = []
    projectList: DailyTaskDisplayWrapper<ProjectModel>[] = []
    collectionList: DailyTaskCollectionDisplayModel[] = []

    updateTab = 'project'

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
                this.projectList = response.body.content.map((project: ProjectModel) => ({
                    content: project,
                    selected: false,
                }))
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

    createDailyTask(dailyTask: Partial<DailyTaskModel>): void {
        dailyTaskService.createDailyTask(dailyTask).then(
            (response: any) => {
                this.dailyTaskList.push(response.body)
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    updateDailyTask(dailyTaskId: number, dailyTaskForm: Partial<DailyTaskModel>): void {
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

    deleteDailyTask(dailyTaskId: number): void {
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

<style scoped lang="scss">
.position-relative {
    position: relative;
    height: 100%;
}

.tab-wrapper {
    height: 30rem;
}
</style>
