<template>
  <v-container v-if="project">
    <h1>Project : {{ project.name }}</h1>
    <v-divider class="my-3"></v-divider>
    <v-row>
      <v-col cols="8">
        <div class="d-flex align-center mb-1">
          <h3 class="flex-grow-1 mb-3 ml-2">Tasks</h3>
          <div>
            <v-btn icon :color="createTaskCardDisplayed ? 'accent': null"
                   @click="toggleCreateTaskCardDisplay">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
            <v-btn icon :color="editTasksDisplay ? 'purple': null" @click="editTasksDisplay = !editTasksDisplay"
                   v-click-outside="{handler: () => editTasksDisplay = false, include: includedEditTaskDisplayHtmlElements}">
              <v-icon>mdi-playlist-edit</v-icon>
            </v-btn>
          </div>
        </div>

        <TaskItemCard v-for="task in tasksUncompleted" :key="task.id" :task="task" :displayEditBtn="editTasksDisplay"
                      @toggleTaskState="toggleTaskState" @toggleEditMode="toggleTaskEditMode"
                      @taskFormSubmit="handleTaskFormSubmit" @deleteTask="deleteTask"
                      class="edit-task-included"></TaskItemCard>

        <h3 class="mt-7 mb-3 ml-2">Tasks completed</h3>

        <TaskItemCard v-for="task in tasksCompleted" :key="task.id" :task="task" :displayEditBtn="editTasksDisplay"
                      @toggleTaskState="toggleTaskState" @toggleEditMode="toggleTaskEditMode"
                      @taskFormSubmit="handleTaskFormSubmit" @deleteTask="deleteTask"
                      class="edit-task-included"></TaskItemCard>
      </v-col>
      <v-col cols="4">
        <v-card class="mb-3">
          <v-card-title>
            <h3>{{ tasksCompleted.length }}/{{ project.tasks.length }}</h3>
          </v-card-title>
        </v-card>
        <v-card>
          <v-card-title>Description</v-card-title>
          <v-card-text>
            {{ project.description }}
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import ProjectModel from "@/models/project/project.model";
import {projectService} from "@/api/project.api";
import TaskItemCard from "@/views/project/components/TaskItemCard.vue";
import {taskService} from "@/api/task.api";
import {TaskDisplayModel} from "@/models/task/task.model";

@Component({
  components: {
    TaskItemCard,
  }
})
export default class ProjectDetail extends Vue {
  @Prop() private projectId!: string;
  private project: ProjectModel = null;
  // Todo: see if multiple card can be in edit mode
  private editTasksDisplay = false;

  get tasksUncompleted(): TaskDisplayModel[] {
    return this.project.tasks.filter((task: TaskDisplayModel) => !task.completed);
  }

  get tasksCompleted(): TaskDisplayModel[] {
    return this.project.tasks.filter((task: TaskDisplayModel) => task.completed);
  }

  get createTaskCardDisplayed(): boolean {
    return !this.project.tasks[0].id;
  }

  created(): void {
    this.retrieveProject();
  }

  private retrieveProject(): void {
    projectService.getProjectById(parseInt(this.projectId)).then(
        (response: any) => {
          this.project = response.body;
          this.project.tasks.forEach((task: TaskDisplayModel) => {
            this.$set(task, 'editMode', false);
          });
        }, (error: any) => {
          console.log(error);
        }
    );
  }

  private toggleTaskState(taskId: number): void {
    const task = this.project.tasks.find((task: TaskDisplayModel) => task.id === taskId);
    taskService.updateTaskById(taskId, {completed: !task.completed} as TaskDisplayModel).then(
        (response: any) => {
          task.completed = response.body.completed;
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private toggleTaskEditMode(task: TaskDisplayModel, value: boolean, isTaskCreated: boolean): void {
    if (isTaskCreated) {
      task.editMode = value;
    } else if (!isTaskCreated && !value) {
      this.project.tasks.shift();
    }
  }

  private toggleCreateTaskCardDisplay(): void {
    // Test if create task card is already shown
    if (this.project.tasks[0].id) {
      this.project.tasks.unshift({editMode: true} as TaskDisplayModel);
    } else {
      this.project.tasks.shift();
    }
  }

  private handleTaskFormSubmit(taskId: number, taskForm: Partial<TaskDisplayModel>): void {
    if (taskId) {
      this.updateTask(taskId, taskForm);
    } else {
      this.createTask(taskForm);
    }
  }

  private createTask(taskForm: Partial<TaskDisplayModel>): void {
    taskForm.projectId = this.project.id;
    taskService.createTask(taskForm).then(
        (response: any) => {
          Object.assign(this.project.tasks[0], response.body, {editMode: false});
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private updateTask(taskId: number, taskForm: Partial<TaskDisplayModel>): void {
    taskService.updateTaskById(taskId, taskForm).then(
        (response: any) => {
          const task = this.project.tasks.find((t: TaskDisplayModel) => t.id === response.body.id);
          Object.assign(task, response.body, {editMode: false});
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private deleteTask(taskId: number): void {
    taskService.deleteTaskById(taskId).then(
        (response: any) => {
          const taskIndex = this.project.tasks.findIndex((task: TaskDisplayModel) => task.id === taskId);
          if (taskIndex !== -1) {
            this.project.tasks.splice(taskIndex, 1);
          }
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private includedEditTaskDisplayHtmlElements(): Element[] {
    return [...document.querySelectorAll('.edit-task-included')];
  }

}
</script>

<style scoped lang="scss">

</style>