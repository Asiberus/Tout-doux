<template>
  <v-container v-if="project">
    <h1>Project : {{ project.name }}</h1>
    <v-divider class="my-3"></v-divider>
    <v-row>
      <v-col cols="8">
        <div class="d-flex align-center mb-1">
          <h3 class="flex-grow-1 mb-3 ml-2">Tasks</h3>
          <div class="">
            <v-btn icon :color="createTaskCardDisplay ? 'accent': null"
                   @click="createTaskCardDisplay = !createTaskCardDisplay">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
            <v-btn icon :color="editTasksDisplay ? 'purple': null" @click="editTasksDisplay = !editTasksDisplay">
              <v-icon>mdi-playlist-edit</v-icon>
            </v-btn>
          </div>
        </div>

        <CreateTaskCard v-if="createTaskCardDisplay" @submit="createTask()"
                        @close="createTaskCardDisplay = false"></CreateTaskCard>

        <TaskItemCard v-for="task in project.tasks" :key="task.id" :task="task" :displayEditBtn="editTasksDisplay"
                      @toggleTaskState="toggleTaskState" @updateTask="updateTask"
                      @deleteTask="deleteTask"></TaskItemCard>
        <!--        <p v-for="task in project.tasks" :key="'task-name' + task.id"> {{ task }}</p>-->
      </v-col>
      <v-col cols="4">
        <v-card class="mb-3">
          <v-card-title>
            <h3>{{ tasksCompleted }}/{{ project.tasks.length }}</h3>
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
import TaskItemCard from "@/components/TaskItemCard.vue";
import TaskModel from "@/models/task/task.model";
import CreateTaskCard from "@/components/CreateTaskCard.vue";
import {taskService} from "@/api/task.api";

@Component({
  components: {
    TaskItemCard,
    CreateTaskCard
  }
})
export default class ProjectDetail extends Vue {
  @Prop() private projectId!: string;
  private project!: ProjectModel = null;
  private createTaskCardDisplay = false;
  private editTasksDisplay = false;

  get tasksCompleted(): number {
    return this.project.tasks.filter((task: TaskModel) => task.completed).length;
  }

  created(): void {
    this.retrieveProject();
  }

  private retrieveProject(): void {
    projectService.getProjectById(this.projectId).then(
        (response: any) => {
          this.project = response.body;
        },
        (error: any) => {
          console.log(error);
        }
    );
  }

  private toggleTaskState(taskId: string): void {
    const task = this.project.tasks.find((task: TaskModel) => task.id === taskId);
    taskService.updateTaskById(taskId, {completed: !task.completed}).then(
        (response: any) => {
          task.completed = response.body.completed;
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private createTask(): void {
    console.log('create task');
    this.createTaskCardDisplay = false;
  }

  private updateTask(taskId: string, taskForm: Partial<TaskModel>): void {
    console.log('update task : ', taskId, taskForm);
    taskService.updateTaskById(taskId, taskForm).then(
        (response: any) => {
          const task = this.project.tasks.find((t: TaskModel) => t.id === response.body.id);
          task.name = response.body.name;
          task.priority = response.body.priority;
        },
        (error: any) => {
          console.error(error);
        }
    )
  }

  private deleteTask(taskId: string): void {
    taskService.deleteTaskById(taskId).then(
        (response: any) => {
          const taskIndex = this.project.tasks.findIndex((task: TaskModel) => task.id === taskId);
          if (taskIndex !== -1) {
            this.project.tasks.splice(taskIndex, 1);
          }
        },
        (error: any) => {
          console.error(error);
        }
    )
  }

}
</script>

<style scoped lang="scss">

</style>