<template>
    <v-row dense>
        <v-col cols="8" class="d-flex">
            <v-tabs
                v-model="tab"
                background-color="transparent"
                color="accent variant-1"
                vertical
                @change="resetSelectedItem()"
                class="flex-grow-0 w-auto mb-3">
                <v-tab>
                    <v-icon>mdi-briefcase-variant</v-icon>
                </v-tab>
                <v-tab>
                    <v-icon>mdi-list-box</v-icon>
                </v-tab>
                <v-tab disabled>
                    <v-icon>mdi-calendar-range</v-icon>
                </v-tab>
                <v-tab disabled>
                    <v-icon>mdi-calendar-month</v-icon>
                </v-tab>
                <v-tab disabled>
                    <v-icon>mdi-timeline</v-icon>
                </v-tab>
            </v-tabs>
            <v-tabs-items v-model="tab" class="transparent flex-grow-1">
                <v-tab-item :transition="false">
                    <h5 class="text-h5 ml-2">Project</h5>
                    <template v-if="projectList.length">
                        <v-row align-content="start" no-gutters class="project-card-wrapper">
                            <v-col
                                v-for="project in projectList"
                                :key="'project-' + project.content.id"
                                cols="4">
                                <DailyUpdateProjectListItem
                                    :project="project.content"
                                    :daily-task-list="dailyTaskList"
                                    :selected.sync="project.selected"
                                    :section-selected="projectSectionSelected"
                                    @select-task="createDailyTask"
                                    @unselect="project.selected = false">
                                </DailyUpdateProjectListItem>
                            </v-col>
                        </v-row>
                    </template>
                    <template v-else>
                        <EmptyListDisplay message="No project available">
                            <template #img>
                                <img
                                    src="../../../../../assets/project.svg"
                                    alt="No Project"
                                    height="250" />
                            </template>
                        </EmptyListDisplay>
                    </template>
                </v-tab-item>
                <v-tab-item :transition="false">
                    <h5 class="text-h5 ml-2">Collection</h5>
                    <template v-if="collectionList.length">
                        <v-row align-content="start" no-gutters class="collection-card-wrapper">
                            <v-col
                                v-for="collection in collectionList"
                                :key="'collection-' + collection.content.id"
                                cols="4">
                                <DailyUpdateCollectionListItem
                                    :collection="collection.content"
                                    :daily-task-list="dailyTaskList"
                                    :selected.sync="collection.selected"
                                    @unselect="collection.selected = false"
                                    @select-task="createDailyTask">
                                </DailyUpdateCollectionListItem>
                            </v-col>
                        </v-row>
                    </template>
                    <template v-else>
                        <EmptyListDisplay message="No collection available">
                            <template #img>
                                <img
                                    src="../../../../../assets/project.svg"
                                    alt="No Collection"
                                    height="250" />
                            </template>
                        </EmptyListDisplay>
                    </template>
                </v-tab-item>
                <v-tab-item :transition="false">
                    <h5 class="text-h5 ml-2">Weekly task</h5>
                </v-tab-item>
                <v-tab-item :transition="false">
                    <h5 class="text-h5 ml-2">Monthly task</h5>
                </v-tab-item>
                <v-tab-item :transition="false">
                    <h5 class="text-h5 ml-2">Generic task</h5>
                </v-tab-item>
            </v-tabs-items>
        </v-col>
        <v-col cols="4">
            <DailyUpdateTaskList
                :dailyTaskList.sync="dailyTaskList"
                @create-daily-task="createDailyTask"
                @update-daily-task="updateDailyTask"
                @delete-daily-task="deleteDailyTask"
                @select="select">
            </DailyUpdateTaskList>
        </v-col>
    </v-row>
</template>

<script lang="ts">
import { collectionService } from '@/api/collection.api'
import { dailyTaskService } from '@/api/daily-task.api'
import { projectService } from '@/api/project.api'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { CollectionTask } from '@/models/collection.model'
import {
    DailyTask,
    DailyTaskDisplay,
    DailyTaskDisplayWrapper,
    DailyUpdateTaskTab,
} from '@/models/daily-task.model'
import { ProjectTask } from '@/models/project.model'
import DailyUpdateCollectionListItem from '@/views/daily/daily-update/steps/task/components/DailyUpdateCollectionListItem.vue'
import DailyUpdateProjectListItem from '@/views/daily/daily-update/steps/task/components/DailyUpdateProjectListItem.vue'
import DailyUpdateTaskList from '@/views/daily/daily-update/steps/task/components/DailyUpdateTaskList.vue'
import moment from 'moment'
import { Component, Emit, Prop, Vue } from 'vue-property-decorator'

// Todo : add btn to create project in no project svg
// Todo : add btn to create collection in no collection svg
@Component({
    components: {
        DailyUpdateProjectListItem,
        DailyUpdateCollectionListItem,
        DailyUpdateTaskList,
        EmptyListDisplay,
    },
})
export default class DailyUpdateTask extends Vue {
    @Prop({ required: true }) private date!: string

    dailyTaskList: DailyTaskDisplay[] = []
    projectList: DailyTaskDisplayWrapper<ProjectTask>[] = []
    collectionList: DailyTaskDisplayWrapper<CollectionTask>[] = []

    tab: DailyUpdateTaskTab = DailyUpdateTaskTab.Project
    projectSectionSelected: number = 0

    created(): void {
        this.retrieveDailyTaskList()
        this.retrieveProjectList()
        this.retrieveCollectionList()
    }

    @Emit('daily-task-count')
    private emitDailyTaskCount(): number {
        return this.dailyTaskList.length
    }

    private retrieveDailyTaskList(): void {
        const date = moment().format('Y-MM-DD')
        dailyTaskService.getDailyTasksByDate(date).then(
            (response: any) => {
                this.dailyTaskList = response.body.content
                this.dailyTaskList.forEach((dailyTask: DailyTaskDisplay) => {
                    this.$set(dailyTask, 'editMode', false)
                })
                this.emitDailyTaskCount()
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    private retrieveProjectList(): void {
        projectService.getProjectList({ archived: false, has_uncompleted_task: true }).then(
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
        collectionService.getCollectionList({ archived: false, has_uncompleted_task: true }).then(
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
                this.emitDailyTaskCount()
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
                    this.emitDailyTaskCount()
                }
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    select(tab: DailyUpdateTaskTab, id: number, sectionId: number): void {
        this.tab = tab
        this.resetSelectedItem()

        if (tab === DailyUpdateTaskTab.Project) {
            this.projectList = this.projectList.map(({ content }) => ({
                content,
                selected: content.id === id,
            }))
            this.projectSectionSelected = sectionId ?? 0
        } else {
            this.collectionList = this.collectionList.map(({ content }) => ({
                content,
                selected: content.id === id,
            }))
        }
    }

    resetSelectedItem(): void {
        this.projectList = this.projectList.map(item => ({ ...item, selected: false }))
        this.collectionList = this.collectionList.map(item => ({ ...item, selected: false }))
    }
}
</script>

<style scoped lang="scss">
.project-card-wrapper,
.collection-card-wrapper {
    min-height: 30rem;
    height: 100%;
    position: relative;
}

.w-auto {
    width: auto;
}
</style>
