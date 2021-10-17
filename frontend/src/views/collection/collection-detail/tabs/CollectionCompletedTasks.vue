<template>
    <v-container class="mt-3">
        <template v-if="taskCompleted.length > 0">
            <TaskItemCard v-for="task in taskCompleted" :key="task.id" :task="task"
                          @toggleState="toggleTaskState">
            </TaskItemCard>
        </template>
        <template v-else>
            <EmptyListDisplay message="No tasks completed yet !" class="my-7">
                <template #img>
                    <img src="../../../../assets/no-task-completed.svg" width="300" alt="No tasks completed">
                </template>
            </EmptyListDisplay>
        </template>
    </v-container>
</template>

<script lang="ts">
    import EmptyListDisplay from '@/components/EmptyListDisplay.vue';
    import {CollectionModel} from '@/models/collection.model';
    import {TaskModel} from '@/models/task.model';
    import {collectionActions} from '@/store/modules/collection.store';
    import TaskItemCard from '@/views/components/task/TaskItemCard.vue';
    import {Component, Vue} from 'vue-property-decorator';

    @Component({
        components: {
            TaskItemCard,
            EmptyListDisplay,
        }
    })
    export default class CollectionCompletedTasks extends Vue {
        get collection(): CollectionModel {
            return this.$store.state.collection.currentCollection;
        }

        get taskCompleted(): TaskModel[] {
            return this.collection.tasks.filter(task => task.completed);
        }

        toggleTaskState(id: number, completed: boolean): void {
            this.$store.dispatch(collectionActions.task.editTask, { id, taskForm: { completed } });
        }
    }
</script>

<style scoped lang="scss">

</style>
