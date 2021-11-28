<template>
    <v-container class="mt-3">
        <v-row>
            <v-col cols="8">
                <div class="d-flex align-center mb-1">
                    <h3 class="flex-grow-1 mb-3 ml-2">Tasks</h3>
                    <div>
                        <v-dialog v-model="taskDialog" width="60%">
                            <template #activator="{ on, attrs }">
                                <v-btn v-bind="attrs" v-on="on" icon>
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

                <template v-if="tasksUncompleted.length > 0">
                    <TaskItemCard
                        v-for="task in tasksUncompleted"
                        :key="task.id"
                        :task="task"
                        @toggle-state="toggleTaskState"
                        @update="updateTask"
                        @delete="deleteTask">
                    </TaskItemCard>
                </template>
                <template
                    v-else-if="
                        collection.tasks.length > 0 &&
                        collection.tasks.length === tasksCompleted.length
                    ">
                    <EmptyListDisplay message="You completed all the tasks for this collection!">
                        <template #img>
                            <img
                                src="../../../../assets/all_task_completed.svg"
                                alt="All tasks completed" />
                        </template>
                    </EmptyListDisplay>
                </template>
                <template v-else>
                    <EmptyListDisplay message="No task are related to this collection">
                        <template #img>
                            <img src="../../../../assets/no_tasks.svg" alt="No tasks" />
                        </template>
                    </EmptyListDisplay>
                </template>
            </v-col>
            <v-col cols="4">
                <div class="d-flex justify-center mt-3">
                    <ProgressCircular :value="tasksCompleted.length" :max="collection.tasks.length">
                    </ProgressCircular>
                </div>
                <v-card class="mt-5">
                    <v-card-title>Description</v-card-title>
                    <v-card-text>
                        {{ collection.description }}
                        <div class="d-flex justify-end align-center mt-2" title="Created at">
                            <v-icon small>mdi-clock</v-icon>
                            <span class="font-italic ml-1">{{ createdDate }}</span>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import ProgressCircular from '@/components/ProgressCircular.vue'
import { CollectionTask } from '@/models/collection.model'
import { Task, TaskPost } from '@/models/task.model'
import { collectionActions } from '@/store/modules/collection.store'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import TaskItemCard from '@/views/components/task/TaskItemCard.vue'
import moment from 'moment'
import { Component, Vue } from 'vue-property-decorator'

@Component({
    components: {
        TaskDialog,
        TaskItemCard,
        EmptyListDisplay,
        ProgressCircular,
    },
})
export default class CollectionDescription extends Vue {
    taskDialog = false

    get collection(): CollectionTask {
        return this.$store.state.collection.currentCollection
    }

    get createdDate(): string {
        return moment(this.collection.created_at).format('D MMM. Y')
    }

    get tasksUncompleted(): Task[] {
        return this.collection.tasks.filter((task: Task) => !task.completed)
    }

    get tasksCompleted(): Task[] {
        return this.collection.tasks.filter((task: Task) => task.completed)
    }

    createTask(task: Partial<TaskPost>): void {
        this.taskDialog = false
        task.collectionId = this.collection.id
        this.$store.dispatch(collectionActions.task.addTask, task)
    }

    toggleTaskState(id: number, completed: boolean): void {
        this.$store.dispatch(collectionActions.task.editTask, { id, data: { completed } })
    }

    updateTask(id: number, data: Partial<TaskPost>): void {
        this.$store.dispatch(collectionActions.task.editTask, { id, data })
    }

    deleteTask(id: number): void {
        this.$store.dispatch(collectionActions.task.deleteTask, id)
    }
}
</script>

<style scoped lang="scss"></style>
