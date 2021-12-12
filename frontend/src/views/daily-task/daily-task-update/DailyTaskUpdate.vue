<template>
    <div>
        <h1 class="mb-6 text-h4">
            <span class="grey--text">Daily Task : </span>{{ dateFormatted }}
        </h1>

        <v-row>
            <v-col cols="8">
                <v-tabs v-model="projectCollectionTab" background-color="transparent" class="mb-3">
                    <v-tab>Project</v-tab>
                    <v-tab>Collection</v-tab>
                </v-tabs>
                <v-tabs-items v-model="projectCollectionTab" class="transparent">
                    <v-tab-item :transition="false">
                        <template v-if="projectList.length">
                            <v-row align-content="start" no-gutters class="project-card-wrapper">
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
                    <v-tab-item :transition="false">
                        <template v-if="collectionList.length">
                            <v-row align-content="start" no-gutters class="collection-card-wrapper">
                                <v-col
                                    v-for="collection in collectionList"
                                    :key="'collection-' + collection.content.id"
                                    cols="4">
                                    <DailyTaskUpdateCollectionListItem
                                        :collection="collection.content"
                                        :daily-task-list="dailyTaskList"
                                        :selected.sync="collection.selected"
                                        @unselect="collection.selected = false"
                                        @select-task="createDailyTask">
                                    </DailyTaskUpdateCollectionListItem>
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
                </v-tabs-items>
            </v-col>
            <v-col cols="4">
                <DailyTaskUpdateList
                    :dailyTaskList="dailyTaskList"
                    @create-daily-task="createDailyTask"
                    @update-daily-task="updateDailyTask"
                    @delete-daily-task="deleteDailyTask">
                </DailyTaskUpdateList>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import { collectionService } from '@/api/collection.api'
import { dailyTaskService } from '@/api/daily-task.api'
import { projectService } from '@/api/project.api'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { CollectionTask } from '@/models/collection.model'
import { DailyTaskDisplay, DailyTaskDisplayWrapper, DailyTask } from '@/models/daily-task.model'
import { ProjectTask } from '@/models/project.model'
import DailyTaskUpdateList from '@/views/daily-task/daily-task-update/components/DailyTaskUpdateList.vue'
import DailyTaskUpdateProjectListItem from '@/views/daily-task/daily-task-update/components/DailyTaskUpdateProjectListItem.vue'
import moment from 'moment'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import DailyTaskUpdateCollectionListItem from '@/views/daily-task/daily-task-update/components/DailyTaskUpdateCollectionListItem.vue'

// Todo : add btn to create project in no project svg
// Todo : add btn to create collection in no collection svg
@Component({
    components: {
        DailyTaskUpdateProjectListItem,
        DailyTaskUpdateCollectionListItem,
        DailyTaskUpdateList,
        EmptyListDisplay,
    },
})
export default class DailyTaskUpdate extends Vue {
    @Prop() private date!: string

    dailyTaskList: DailyTaskDisplay[] = []
    projectList: DailyTaskDisplayWrapper<ProjectTask>[] = []
    collectionList: DailyTaskDisplayWrapper<CollectionTask>[] = []

    projectCollectionTab = 0

    get dateFormatted(): string {
        return moment(this.date).format('dddd DD MMMM Y')
    }

    created(): void {
        this.retrieveDailyTaskList()
        this.retrieveProjectList()
        this.retrieveCollectionList()
    }

    @Watch('projectCollectionTab')
    onProjectCollectionTabChanges(): void {
        this.projectList.forEach(p => (p.selected = false))
        this.collectionList.forEach(p => (p.selected = false))
    }

    private retrieveDailyTaskList(): void {
        const date = moment().format('Y-MM-DD')
        dailyTaskService.getDailyTasksByDate(date).then(
            (response: any) => {
                this.dailyTaskList = response.body.content
                this.dailyTaskList.forEach((dailyTask: DailyTaskDisplay) => {
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
                this.projectList = response.body.content.map((project: ProjectTask) => ({
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
        collectionService.getCollectionList({ archived: false }).then(
            (response: any) => {
                this.collectionList = response.body.content.map((collection: CollectionTask) => ({
                    content: collection,
                    selected: false,
                }))
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    createDailyTask(dailyTask: Partial<DailyTask>): void {
        dailyTaskService.createDailyTask(dailyTask).then(
            (response: any) => {
                this.dailyTaskList.push(response.body)
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    updateDailyTask(dailyTaskId: number, dailyTaskForm: Partial<DailyTask>): void {
        dailyTaskService.updateDailyTask(dailyTaskId, dailyTaskForm).then(
            (response: any) => {
                const dailyTask = this.dailyTaskList.find(
                    (dailyTask: DailyTaskDisplay) => dailyTask.id === response.body.id
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
                    (dailyTask: DailyTaskDisplay) => dailyTask.id === dailyTaskId
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
.project-card-wrapper,
.collection-card-wrapper {
    min-height: 35rem;
    height: 100%;
}
</style>
