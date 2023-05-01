<template>
    <v-row>
        <v-col cols="8">
            <div class="d-flex align-center mb-3">
                <h5 class="text-h5">List of {{ collection.itemName }}</h5>
                <v-spacer></v-spacer>
                <FilterChip
                    v-if="collection.tasks.length > 0"
                    v-model="displayCompletedTask"
                    color="green darken-2"
                    icon="mdi-trophy"
                    class="mr-3">
                    Completed
                </FilterChip>
                <v-dialog v-model="taskDialog" width="60%">
                    <template #activator="{ on, attrs }">
                        <v-btn v-bind="attrs" v-on="on" :disabled="collection.archived">
                            <v-icon left>mdi-plus</v-icon>
                            {{ collection.itemName }}
                        </v-btn>
                    </template>
                    <TaskDialog
                        :is-dialog-open="taskDialog"
                        :item-name="collection.itemName"
                        @create="createTask"
                        @close="taskDialog = false">
                    </TaskDialog>
                </v-dialog>
            </div>

            <template v-if="!displayCompletedTask">
                <template v-if="uncompletedTasks.length > 0">
                    <TaskCard
                        v-for="task in uncompletedTasks"
                        :key="task.id"
                        :task="task"
                        :disabled="collection.archived"
                        :item-name="collection.itemName"
                        @toggle-state="toggleTaskState"
                        @update="updateTask"
                        @delete="deleteTask"
                        class="mb-2">
                    </TaskCard>
                </template>
                <template
                    v-else-if="
                        collection.tasks.length > 0 &&
                        collection.tasks.length === completedTasks.length
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
            </template>
            <template v-else>
                <template v-if="completedTasks.length > 0">
                    <TaskCard
                        v-for="task of completedTasks"
                        :key="task.id"
                        :task="task"
                        :disabled="collection.archived"
                        @toggle-state="toggleTaskState"
                        @update="updateTask"
                        @delete="deleteTask"
                        class="mb-2">
                    </TaskCard>
                </template>
                <template v-else>
                    <EmptyListDisplay message="You didn't complete any task yet!">
                        <template #img>
                            <img src="../../../../assets/no_tasks.svg" alt="No tasks" />
                        </template>
                    </EmptyListDisplay>
                </template>
            </template>
        </v-col>
        <v-col cols="4">
            <div class="d-flex justify-center mb-3">
                <ProgressWheel
                    :mode="preferences.progressWheelMode"
                    :value="completedTasks.length"
                    :max="collection.tasks.length"
                    color="collection lighten-2">
                </ProgressWheel>
            </div>
            <h5 class="text-h5 mb-2">Description</h5>
            <v-card class="rounded-lg">
                <v-card-text>
                    {{ collection.description }}
                    <div class="d-flex justify-end align-center mt-2" title="Created on">
                        <v-icon small>mdi-clock</v-icon>
                        <span class="font-italic ml-1">{{ createdDate }}</span>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import ProgressWheel from '@/components/ProgressWheel.vue'
import { CollectionDetail } from '@/models/collection.model'
import { Task, TaskPatch, TaskPost } from '@/models/task.model'
import { collectionActions } from '@/store/modules/collection.store'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import TaskCard from '@/views/components/task/TaskCard.vue'
import moment from 'moment'
import { Component, Vue } from 'vue-property-decorator'
import { Preferences } from '@/models/preferences.model'

@Component({
    components: {
        TaskDialog,
        TaskCard,
        EmptyListDisplay,
        ProgressWheel,
        FilterChip,
    },
})
export default class CollectionDescription extends Vue {
    taskDialog = false
    displayCompletedTask = false

    get preferences(): Preferences {
        return this.$store.state.preferences.preferences
    }

    get collection(): CollectionDetail {
        return this.$store.state.collection.currentCollection
    }

    get createdDate(): string {
        return moment(this.collection.createdOn).format('D MMMM Y')
    }

    get uncompletedTasks(): Task[] {
        return this.collection.tasks.filter(({ completed }) => !completed)
    }

    get completedTasks(): Task[] {
        return this.collection.tasks.filter(({ completed }) => completed)
    }

    createTask(task: TaskPost): void {
        this.taskDialog = false
        task.collectionId = this.collection.id
        this.$store.dispatch(collectionActions.task.addTask, task)
    }

    toggleTaskState(id: number, completed: boolean): void {
        this.$store.dispatch(collectionActions.task.editTask, { id, data: { completed } })
    }

    updateTask(id: number, data: TaskPatch): void {
        this.$store.dispatch(collectionActions.task.editTask, { id, data })
    }

    deleteTask(id: number): void {
        this.$store.dispatch(collectionActions.task.deleteTask, id)
    }
}
</script>
