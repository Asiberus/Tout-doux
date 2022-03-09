<template>
    <div>
        <v-row>
            <v-col cols="9">
                <h3 class="mb-3">Description</h3>
                <v-card>
                    <v-card-text>
                        {{ project.description }}
                        <div class="d-flex justify-end align-center mt-2" title="Created at">
                            <v-icon small>mdi-clock</v-icon>
                            <span class="font-italic ml-1">{{ createdDate }}</span>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col cols="3">
                <div class="d-flex justify-center mt-3">
                    <ProgressCircular :value="allTasksCompleted.length" :max="allTasks.length">
                    </ProgressCircular>
                </div>
            </v-col>
        </v-row>

        <div class="d-flex align-center mt-12 mb-5">
            <h3 class="flex-grow-1">General Tasks</h3>
            <div>
                <v-dialog v-model="taskDialog" width="60%">
                    <template #activator="{ on, attrs }">
                        <v-btn v-bind="attrs" v-on="on" icon :disabled="project.archived">
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                    </template>
                    <TaskDialog
                        :is-dialog-open="taskDialog"
                        @submit="createTask"
                        @close="taskDialog = false">
                    </TaskDialog>
                </v-dialog>
            </div>
        </div>

        <template v-if="taskUncompleted.length > 0">
            <v-row no-gutters>
                <v-col v-for="task in taskUncompleted" :key="task.id" cols="6" class="px-2">
                    <TaskItemCard
                        :task="task"
                        :disabled="project.archived"
                        @toggle-state="toggleTaskState"
                        @update="updateTask"
                        @delete="deleteTask">
                    </TaskItemCard>
                </v-col>
            </v-row>
        </template>
        <template
            v-else-if="project.tasks.length > 0 && project.tasks.length === taskCompleted.length">
            <EmptyListDisplay message="You completed all general tasks of this project !">
                <template #img>
                    <img
                        src="../../../../assets/all_task_completed.svg"
                        width="300"
                        alt="All tasks completed" />
                </template>
            </EmptyListDisplay>
        </template>
        <template v-else>
            <EmptyListDisplay message="This project has no general task yet">
                <template #img>
                    <img src="../../../../assets/no_tasks.svg" width="300" alt="No tasks" />
                </template>
            </EmptyListDisplay>
        </template>
    </div>
</template>

<script lang="ts">
import ProgressCircular from '@/components/ProgressCircular.vue'
import { projectActions } from '@/store/modules/project.store'
import moment from 'moment'
import { Component, Vue } from 'vue-property-decorator'
import { ProjectTask } from '@/models/project.model'
import { Task } from '@/models/task.model'
import TaskItemCard from '@/views/components/task/TaskItemCard.vue'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'

@Component({
    components: {
        TaskItemCard,
        TaskDialog,
        ProgressCircular,
        EmptyListDisplay,
    },
})
export default class ProjectDescription extends Vue {
    taskDialog = false

    get project(): ProjectTask {
        return this.$store.state.project.currentProject
    }

    get createdDate(): string {
        return moment(this.project.created_at).format('D MMM. Y')
    }

    get taskUncompleted(): Task[] {
        return this.project.tasks.filter((task: Task) => !task.completed)
    }

    get taskCompleted(): Task[] {
        return this.project.tasks.filter((task: Task) => task.completed)
    }

    get allTasks(): Task[] {
        return this.project.tasks.concat(...this.project.sections.map(section => section.tasks))
    }

    get allTasksCompleted(): Task[] {
        return this.allTasks.filter(task => task.completed)
    }

    createTask(task: Partial<Task>): void {
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

    updateTask(id: number, data: Partial<Task>): void {
        this.$store.dispatch(projectActions.task.editTask, { id, data, projectId: this.project.id })
    }

    deleteTask(id: number): void {
        this.$store.dispatch(projectActions.task.deleteTask, { id })
    }
}
</script>

<style scoped lang="scss"></style>
