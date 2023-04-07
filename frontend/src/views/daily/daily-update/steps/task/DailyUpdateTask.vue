<template>
    <div class="daily-update-task">
        <v-tabs
            v-model="tab"
            background-color="transparent"
            color="accent variant-1"
            vertical
            @change="resetSelectedItem()">
            <v-tab>
                <v-icon>mdi-briefcase-variant</v-icon>
            </v-tab>
            <v-tab>
                <v-icon>mdi-list-box</v-icon>
            </v-tab>
            <v-tab>
                <v-icon>mdi-timeline</v-icon>
            </v-tab>
            <v-tab disabled>
                <v-icon>mdi-calendar-range</v-icon>
            </v-tab>
            <v-tab disabled>
                <v-icon>mdi-calendar-month</v-icon>
            </v-tab>
        </v-tabs>

        <v-tabs-items v-model="tab" class="transparent">
            <v-tab-item :transition="false">
                <div class="d-flex align-center mb-3">
                    <h5 class="text-h5 mr-2">Project</h5>
                    <v-hover v-slot="{ hover }">
                        <v-btn
                            :to="{ name: 'project-list' }"
                            :exact="true"
                            icon
                            small
                            :color="hover ? 'grey' : 'grey darken-3'"
                            title="Go to project list">
                            <v-icon small>mdi-open-in-new</v-icon>
                        </v-btn>
                    </v-hover>
                </div>
                <template v-if="projectList.length">
                    <div class="project-wrapper">
                        <DailyUpdateProjectListItem
                            v-for="project in projectList"
                            :key="'project-' + project.content.id"
                            :project="project.content"
                            :daily-task-list="dailyTaskList"
                            :selected.sync="project.selected"
                            :section-selected="projectSectionSelected"
                            @select-task="createDailyTask($event)">
                        </DailyUpdateProjectListItem>
                    </div>
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
                <div class="d-flex align-center mb-3">
                    <h5 class="text-h5 mr-2">Collection</h5>
                    <v-hover v-slot="{ hover }">
                        <v-btn
                            :to="{ name: 'collection-list' }"
                            :exact="true"
                            icon
                            small
                            :color="hover ? 'grey' : 'grey darken-3'"
                            title="Go to collection">
                            <v-icon small>mdi-open-in-new</v-icon>
                        </v-btn>
                    </v-hover>
                </div>
                <template v-if="collectionList.length">
                    <div class="collection-wrapper">
                        <DailyUpdateCollectionListItem
                            v-for="collection in collectionList"
                            :key="'collection-' + collection.content.id"
                            :collection="collection.content"
                            :daily-task-list="dailyTaskList"
                            :selected.sync="collection.selected"
                            @select-task="createDailyTask($event)">
                        </DailyUpdateCollectionListItem>
                    </div>
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
                <div class="d-flex align-center mb-3">
                    <h5 class="text-h5 mr-2">Common task</h5>
                    <v-hover v-slot="{ hover }">
                        <v-btn
                            :to="{ name: 'settings-common-tasks' }"
                            :exact="true"
                            icon
                            small
                            :color="hover ? 'grey' : 'grey darken-3'"
                            title="Go to common task">
                            <v-icon small>mdi-open-in-new</v-icon>
                        </v-btn>
                    </v-hover>
                </div>
                <DailyUpdateCommonTask
                    :common-task-list="commonTaskList"
                    :daily-task-list="dailyTaskList"
                    @select-common-task="createDailyTask($event)">
                </DailyUpdateCommonTask>
            </v-tab-item>
            <v-tab-item :transition="false">
                <h5 class="text-h5 mb-3">Weekly task</h5>
            </v-tab-item>
            <v-tab-item :transition="false">
                <h5 class="text-h5 mb-3">Monthly task</h5>
            </v-tab-item>
        </v-tabs-items>

        <DailyUpdateTaskList
            :dailyTaskList.sync="dailyTaskList"
            @create-daily-task="createDailyTask"
            @update-daily-task="updateDailyTask"
            @delete-daily-task="deleteDailyTask"
            @select="select">
        </DailyUpdateTaskList>
    </div>
</template>

<script lang="ts">
import { collectionService } from '@/api/collection.api'
import { dailyTaskService } from '@/api/daily-task.api'
import { projectService } from '@/api/project.api'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { CollectionDetail } from '@/models/collection.model'
import {
    DailyTaskDisplay,
    DailyTaskDisplayWrapper,
    DailyTaskPatch,
    DailyTaskPost,
    DailyUpdateTaskTab,
} from '@/models/daily-task.model'
import { ProjectDetail } from '@/models/project.model'
import DailyUpdateCollectionListItem from '@/views/daily/daily-update/steps/task/components/DailyUpdateCollectionListItem.vue'
import DailyUpdateProjectListItem from '@/views/daily/daily-update/steps/task/components/DailyUpdateProjectListItem.vue'
import DailyUpdateTaskList from '@/views/daily/daily-update/steps/task/components/DailyUpdateTaskList.vue'
import moment from 'moment'
import { Component, Emit, Prop, Vue } from 'vue-property-decorator'
import DailyUpdateCommonTask from '@/views/daily/daily-update/steps/task/components/DailyUpdateCommonTask.vue'
import { CommonTask } from '@/models/common-task.model'
import { commonTaskService } from '@/api'

// Todo : add btn to create project in no project svg
// Todo : add btn to create collection in no collection svg
@Component({
    components: {
        DailyUpdateProjectListItem,
        DailyUpdateCollectionListItem,
        DailyUpdateCommonTask,
        DailyUpdateTaskList,
        EmptyListDisplay,
    },
})
export default class DailyUpdateTask extends Vue {
    @Prop({ required: true }) private date!: string

    dailyTaskList: DailyTaskDisplay[] = []
    projectList: DailyTaskDisplayWrapper<ProjectDetail>[] = []
    collectionList: DailyTaskDisplayWrapper<CollectionDetail>[] = []
    commonTaskList: CommonTask[] = []

    tab: DailyUpdateTaskTab = DailyUpdateTaskTab.Project
    projectSectionSelected: number = 0

    created(): void {
        this.retrieveDailyTaskList()
        this.retrieveProjectList()
        this.retrieveCollectionList()
        this.fetchCommonTaskList()
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
        projectService.getProjectListDetailed({ archived: false, has_uncompleted_task: true }).then(
            (response: any) => {
                this.projectList = response.body.content.map((project: ProjectDetail) => ({
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
        collectionService
            .getCollectionListDetailed({ archived: false, has_uncompleted_task: true })
            .then(
                (response: any) => {
                    this.collectionList = response.body.content.map(
                        (collection: CollectionDetail) => ({
                            content: collection,
                            selected: false,
                        })
                    )
                },
                (error: any) => {
                    console.error(error)
                }
            )
    }

    private fetchCommonTaskList(): void {
        commonTaskService
            .getCommonTaskList({ size: 0 })
            .then((response: any) => {
                this.commonTaskList = response.body.content
            })
            .catch((error: any) => console.error(error))
    }

    createDailyTask(dailyTask: DailyTaskPost): void {
        dailyTaskService.createDailyTask(dailyTask).then(
            (response: any) => {
                this.dailyTaskList.push({ ...response.body, editMode: false })
                this.emitDailyTaskCount()
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    updateDailyTask(dailyTaskId: number, dailyTaskForm: DailyTaskPatch): void {
        dailyTaskService.updateDailyTask(dailyTaskId, dailyTaskForm).then(
            (response: any) => {
                const dailyTask = this.dailyTaskList.find(
                    (dailyTask: DailyTaskDisplay) => dailyTask.id === response.body.id
                )
                if (dailyTask) Object.assign(dailyTask, response.body, { editMode: false })
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
.daily-update-task {
    height: 100%;
    display: grid;
    grid-template-columns: auto 1fr 33%;
    grid-template-rows: auto;
    gap: 16px;
}

.project-wrapper,
.collection-wrapper {
    flex-grow: 1;
    min-height: 30rem;
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: min-content;
    gap: 8px;
}
</style>
