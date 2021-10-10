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
                            <TaskDialog :is-dialog-open="taskDialog"
                                        @submit="createTask"
                                        @close="taskDialog = false">
                            </TaskDialog>
                        </v-dialog>
                    </div>
                </div>

                <template v-if="tasksUncompleted.length > 0">
                    <TaskItemCard v-for="task in tasksUncompleted" :key="task.id" :task="task"
                                  @toggleState="toggleTaskState"
                                  @update="updateTask"
                                  @delete="deleteTask">
                    </TaskItemCard>
                </template>
                <template v-else-if="collection.tasks.length > 0 && collection.tasks.length === tasksCompleted.length">
                    <EmptyListDisplay message="You completed all the tasks for this collection!">
                        <template #img>
                            <img src="../../../../assets/all_task_completed.svg" alt="All tasks completed">
                        </template>
                    </EmptyListDisplay>
                </template>
                <template v-else>
                    <EmptyListDisplay message="No task are related to this collection">
                        <template #img>
                            <img src="../../../../assets/no_tasks.svg" alt="No tasks">
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
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
  import {taskService} from '@/api/task.api';
  import EmptyListDisplay from '@/components/EmptyListDisplay.vue';
  import ProgressCircular from '@/components/ProgressCircular.vue';
  import {CollectionModel} from '@/models/collection.model';
  import {TaskModel} from '@/models/task.model';
  import TaskDialog from '@/views/components/task/TaskDialog.vue';
  import TaskItemCard from '@/views/components/task/TaskItemCard.vue';
  import {Component, Prop, Vue} from 'vue-property-decorator';

  @Component({
    components: {
      TaskDialog,
      TaskItemCard,
      EmptyListDisplay,
      ProgressCircular,
    }
  })
  export default class CollectionDescription extends Vue {
    @Prop() private collection!: CollectionModel;

    private taskDialog = false;

    get tasksUncompleted(): TaskModel[] {
      return this.collection.tasks.filter((task: TaskModel) => !task.completed);
    }

    get tasksCompleted(): TaskModel[] {
      return this.collection.tasks.filter((task: TaskModel) => task.completed);
    }

    private toggleTaskState(taskId: number, completed: boolean): void {
      taskService.updateTaskById(taskId, {completed}).then(
          response => {
            const task = this.collection.tasks.find((task: TaskModel) => task.id === response.body.id);
            if (task) task.completed = response.body.completed;
          }
      )
    }

    private createTask(taskForm: Partial<TaskModel>): void {
      taskForm.collectionId = this.collection.id;
      taskService.createTask(taskForm).then(
          (response: any) => {
            this.collection.tasks.unshift(response.body);
            this.taskDialog = false;
          }, (error: any) => {
            console.error(error);
          }
      );
    }

    private updateTask(taskId: number, taskForm: Partial<TaskModel>): void {
      taskService.updateTaskById(taskId, taskForm).then(
          response => {
            const task = this.collection.tasks.find((task: TaskModel) => task.id === response.body.id);
            if (task) Object.assign(task, response.body);
          }
      )
    }

    private deleteTask(taskId: number): void {
      taskService.deleteTaskById(taskId).then(
          () => {
            const taskIndex = this.collection.tasks.findIndex((task: TaskModel) => task.id === taskId);
            if (taskIndex !== -1) this.collection.tasks.splice(taskIndex, 1);
          }, error => {
            console.error(error);
          }
      )
    }
  }
</script>

<style scoped lang="scss">

</style>
