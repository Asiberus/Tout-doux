<template>
    <div>
        <v-row>
            <v-col cols="9">
                <h3 class="mb-3">Description</h3>
                <v-card class="mb-3">
                    <v-card-text>
                        {{ project.description }}
                        <div class="d-flex justify-end align-center mt-2" title="Created on">
                            <v-icon small>mdi-clock</v-icon>
                            <span class="font-italic ml-1">{{ createdDate }}</span>
                        </div>
                    </v-card-text>
                </v-card>
                <template v-if="project.tags.length > 0">
                    <div class="d-flex align-center">
                        <v-icon left>mdi-tag</v-icon>
                        <TagGroup :tag-list="project.tags" :large="true"></TagGroup>
                    </div>
                </template>
            </v-col>
            <v-col cols="3">
                <div class="d-flex justify-center mt-3">
                    <ProgressCircular :value="allCompletedTasks.length" :max="allTasks.length">
                    </ProgressCircular>
                </div>
            </v-col>
        </v-row>

        <div class="d-flex align-center mt-10 mb-2">
            <h3>General Tasks</h3>
            <v-spacer></v-spacer>
            <FilterChip
                v-if="project.tasks.length > 0"
                v-model="displayCompletedTask"
                color="green darken-2"
                icon="mdi-trophy"
                class="mr-3">
                Completed
            </FilterChip>
            <v-dialog v-model="taskDialog" width="60%">
                <template #activator="{ on, attrs }">
                    <v-btn v-bind="attrs" v-on="on" :disabled="project.archived">
                        <v-icon left>mdi-plus</v-icon>
                        task
                    </v-btn>
                </template>
                <TaskDialog
                    :is-dialog-open="taskDialog"
                    @create="createTask"
                    @close="taskDialog = false">
                </TaskDialog>
            </v-dialog>
        </div>

        <template v-if="!displayCompletedTask">
            <template v-if="uncompletedTasks.length > 0">
                <div class="task-wrapper">
                    <TaskCard
                        v-for="task of uncompletedTasks"
                        :key="task.id"
                        :task="task"
                        :disabled="project.archived"
                        @toggle-state="toggleTaskState"
                        @update="updateTask"
                        @delete="deleteTask">
                    </TaskCard>
                </div>
            </template>
            <template
                v-else-if="
                    project.tasks.length > 0 && project.tasks.length === completedTasks.length
                ">
                <EmptyListDisplay message="You completed all general tasks of this project !">
                    <template #img>
                        <img
                            src="../../../../assets/all_task_completed.svg"
                            width="270"
                            alt="All tasks completed" />
                    </template>
                </EmptyListDisplay>
            </template>
            <template v-else>
                <EmptyListDisplay message="This project has no general task">
                    <template #img>
                        <img src="../../../../assets/no_tasks.svg" width="270" alt="No tasks" />
                    </template>
                </EmptyListDisplay>
            </template>
        </template>
        <template v-else>
            <template v-if="completedTasks.length > 0">
                <div class="task-wrapper">
                    <TaskCard
                        v-for="task of completedTasks"
                        :key="task.id"
                        :task="task"
                        :disabled="project.archived"
                        @update="updateTask"
                        @delete="deleteTask"
                        @toggle-state="toggleTaskState">
                    </TaskCard>
                </div>
            </template>
            <template v-else>
                <EmptyListDisplay message="You didn't completed any general tasks yet !">
                    <template #img>
                        <img
                            src="../../../../assets/no_tasks.svg"
                            width="200"
                            alt="No tasks completed" />
                    </template>
                </EmptyListDisplay>
            </template>
        </template>
    </div>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import ProgressCircular from '@/components/ProgressCircular.vue'
import { ProjectDetail } from '@/models/project.model'
import { Task, TaskPatch, TaskPost } from '@/models/task.model'
import { projectActions } from '@/store/modules/project.store'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import TaskCard from '@/views/components/task/TaskCard.vue'
import moment from 'moment'
import { Component, Vue } from 'vue-property-decorator'
import TagGroup from '@/views/components/tag/TagGroup.vue'

@Component({
    components: {
        TagGroup,
        TaskCard,
        TaskDialog,
        ProgressCircular,
        EmptyListDisplay,
        FilterChip,
    },
})
export default class ProjectDescription extends Vue {
    taskDialog = false
    displayCompletedTask = false

    get project(): ProjectDetail {
        return this.$store.state.project.currentProject
    }

    get createdDate(): string {
        return moment(this.project.createdOn).format('D MMM. Y')
    }

    get uncompletedTasks(): Task[] {
        return this.project.tasks.filter(({ completed }) => !completed)
    }

    get completedTasks(): Task[] {
        return this.project.tasks.filter(({ completed }) => completed)
    }

    get allTasks(): Task[] {
        return this.project.tasks.concat(...this.project.sections.map(({ tasks }) => tasks))
    }

    get allCompletedTasks(): Task[] {
        return this.allTasks.filter(({ completed }) => completed)
    }

    createTask(task: TaskPost): void {
        this.taskDialog = false
        task.projectId = this.project.id
        this.$store.dispatch(projectActions.task.addTask, task)
    }

    toggleTaskState(id: number, completed: boolean): void {
        this.$store.dispatch(projectActions.task.editTask, {
            id,
            data: { completed },
            projectId: this.project.id,
        })
    }

    updateTask(id: number, data: TaskPatch): void {
        this.$store.dispatch(projectActions.task.editTask, { id, data, projectId: this.project.id })
    }

    deleteTask(id: number): void {
        this.$store.dispatch(projectActions.task.deleteTask, { id })
    }
}
</script>

<style scoped lang="scss">
.task-wrapper {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
}
</style>
