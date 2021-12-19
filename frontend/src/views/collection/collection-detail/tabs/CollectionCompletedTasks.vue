<template>
    <div>
        <template v-if="taskCompleted.length > 0">
            <v-row no-gutters>
                <v-col v-for="task in taskCompleted" :key="task.id" cols="6" class="px-2">
                    <TaskItemCard
                        :task="task"
                        :disabled="collection.archived"
                        @toggle-state="toggleTaskState">
                    </TaskItemCard>
                </v-col>
            </v-row>
        </template>
        <template v-else>
            <EmptyListDisplay message="No tasks completed yet !" class="my-7">
                <template #img>
                    <img
                        src="../../../../assets/no-task-completed.svg"
                        width="300"
                        alt="No tasks completed" />
                </template>
            </EmptyListDisplay>
        </template>
    </div>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { CollectionTask } from '@/models/collection.model'
import { Task } from '@/models/task.model'
import { collectionActions } from '@/store/modules/collection.store'
import TaskItemCard from '@/views/components/task/TaskItemCard.vue'
import { Component, Vue } from 'vue-property-decorator'

@Component({
    components: {
        TaskItemCard,
        EmptyListDisplay,
    },
})
export default class CollectionCompletedTasks extends Vue {
    get collection(): CollectionTask {
        return this.$store.state.collection.currentCollection
    }

    get taskCompleted(): Task[] {
        return this.collection.tasks.filter(task => task.completed)
    }

    toggleTaskState(id: number, completed: boolean): void {
        this.$store.dispatch(collectionActions.task.editTask, { id, data: { completed } })
    }
}
</script>

<style scoped lang="scss"></style>
