<template>
  <v-container>
    <v-row class="mt-3">
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
          <ProgressCircular :value="projectAllTasksCompleted.length" :max="projectAllTasks.length">
          </ProgressCircular>
        </div>
      </v-col>
    </v-row>

    <div class="d-flex align-center mt-12 mb-5">
      <h3 class="flex-grow-1">General Tasks</h3>
      <div>
        <v-dialog v-model="taskDialog" width="60%">
          <template #activator="{ on, attrs }">
            <v-btn v-bind="attrs" v-on="on"
                   icon :disabled="project.archived">
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

    <template v-if="taskUncompleted.length > 0">
      <v-row no-gutters>
        <v-col v-for="task in taskUncompleted" :key="task.id" cols="6" class="px-2">
          <TaskItemCard :task="task" :disabled="project.archived"
                        @toggleState="toggleTaskState"
                        @update="updateTask"
                        @delete="deleteTask">
          </TaskItemCard>
        </v-col>
      </v-row>
    </template>
    <template v-else-if="project.tasks.length > 0 && project.tasks.length === taskCompleted.length">
      <EmptyListDisplay message="You completed all general tasks of this project !">
        <template #img>
          <img src="../../../../assets/all_task_completed.svg" width="300" alt="All tasks completed">
        </template>
      </EmptyListDisplay>
    </template>
    <template v-else>
      <EmptyListDisplay message="This project has no general task yet">
        <template #img>
          <img src="../../../../assets/no_tasks.svg" width="300" alt="No tasks">
        </template>
      </EmptyListDisplay>
    </template>
  </v-container>
</template>

<script lang="ts">
import ProgressCircular from '@/components/ProgressCircular.vue';
import moment from 'moment';
import {Component, Prop, Vue} from "vue-property-decorator";
import {ProjectModel} from "@/models/project.model";
import {TaskModel} from "@/models/task.model";
import TaskItemCard from "@/views/components/task/TaskItemCard.vue";
import {taskService} from "@/api/task.api";
import TaskDialog from "@/views/components/task/TaskDialog.vue";
import EmptyListDisplay from "@/components/EmptyListDisplay.vue";

@Component({
  components: {
    TaskItemCard,
    TaskDialog,
    ProgressCircular,
    EmptyListDisplay,
  }
})
export default class ProjectDescription extends Vue {
  @Prop() project!: ProjectModel;

  taskDialog = false;

  get createdDate(): string {
    return moment(this.project.created_at).format('D MMM. Y');
  }

  get taskUncompleted(): TaskModel[] {
    return this.project.tasks.filter((task: TaskModel) => !task.completed);
  }

  get taskCompleted(): TaskModel[] {
    return this.project.tasks.filter((task: TaskModel) => task.completed);
  }

  get projectAllTasks(): TaskModel[] {
    return this.project.tasks.concat(...this.project.sections.map(section => section.tasks));
  }

  get projectAllTasksCompleted(): TaskModel[] {
    return this.projectAllTasks.filter(task => task.completed);
  }

  private toggleTaskState(taskId: number, completed: boolean): void {
    taskService.updateTaskById(taskId, {completed}).then(
        response => {
          const task = this.project.tasks.find((task: TaskModel) => task.id === response.body.id);
          if (task) {
            task.completed = response.body.completed;
          }
        }
    )
  }

  private createTask(taskForm: Partial<TaskModel>): void {
    this.taskDialog = false;
    taskForm.projectId = this.project.id;
    taskService.createTask(taskForm).then(
        response => {
          this.project.tasks.unshift(response.body);
        }, error => {
          console.error(error);
        }
    )
  }

  private updateTask(taskId: number, taskForm: Partial<TaskModel>): void {
    taskService.updateTaskById(taskId, taskForm).then(
        response => {
          const task = this.project.tasks.find((task: TaskModel) => task.id === response.body.id)
          Object.assign(task, response.body);
        }
    )
  }

  private deleteTask(taskId: number): void {
    taskService.deleteTaskById(taskId).then(
        () => {
          const taskIndex = this.project.tasks.findIndex((task: TaskModel) => task.id === taskId);
          if (taskIndex !== -1) {
            this.project.tasks.splice(taskIndex, 1);
          }
        }, error => {
          console.error(error);
        }
    )
  }
}
</script>

<style scoped lang="scss">

</style>
