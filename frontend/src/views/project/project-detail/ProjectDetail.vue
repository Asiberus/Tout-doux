<template>
  <v-container v-if="project">
    <div class="d-flex justify-space-between align-center">
      <h1>
        Project : {{ project.name }}
        <v-chip v-if="project.archived" color="accent" class="ml-3">
          <v-icon small class="mr-1">
            mdi-archive
          </v-icon>
          Archived
        </v-chip>
      </h1>
    </div>

    <v-divider class="my-3"></v-divider>

    <v-tabs v-model="projectTab" background-color="transparent" color="accent">
      <v-tab href="#description">Description</v-tab>
      <v-tab href="#section">Section</v-tab>
      <v-tab disabled>Event</v-tab>
      <v-tab href="#completed-tasks">Completed Task</v-tab>
      <v-tab href="#configuration">Configuration</v-tab>
    </v-tabs>

    <v-tabs-items v-model="projectTab" class="transparent">
      <v-tab-item value="description" :transition="false">
        <ProjectDescription :project="project"></ProjectDescription>
      </v-tab-item>
      <v-tab-item value="section" :transition="false">
        <ProjectSection :project="project"></ProjectSection>
      </v-tab-item>
      <v-tab-item value="event" :transition="false">
      </v-tab-item>
      <v-tab-item value="completed-tasks" :transition="false">
        <ProjectCompletedTasks></ProjectCompletedTasks>
      </v-tab-item>
      <v-tab-item value="configuration" :transition="false">
        <ProjectConfiguration></ProjectConfiguration>
      </v-tab-item>
    </v-tabs-items>

<!--    <v-row>-->
<!--      <v-col cols="8">-->
<!--        <div class="d-flex align-center mb-1">-->
<!--          <h3 class="flex-grow-1 mb-3 ml-2">Tasks</h3>-->
<!--          <div>-->
<!--            <v-btn @click="createTaskDisplayed = !createTaskDisplayed" :disabled="project.archived"-->
<!--                   icon :color="createTaskDisplayed ? 'accent': null">-->
<!--              <v-icon>mdi-plus</v-icon>-->
<!--            </v-btn>-->
<!--            <v-btn @click="editTasksDisplay = !editTasksDisplay"-->
<!--                   :disabled="project.archived || tasksUncompleted.length === 0"-->
<!--                   icon :color="editTasksDisplay ? 'purple': null">-->
<!--              <v-icon>mdi-playlist-edit</v-icon>-->
<!--            </v-btn>-->
<!--          </div>-->
<!--        </div>-->

<!--        <template v-if="tasksUncompleted.length > 0">-->
<!--          <TaskItemCard v-for="task in tasksUncompleted" :key="'task-uncompleted-' + task.id" :task="task"-->
<!--                        :displayEditBtn="editTasksDisplay" :disabled="project.archived"-->
<!--                        @toggleTaskState="toggleTaskState" @toggleEditMode="toggleTaskEditMode"-->
<!--                        @taskFormSubmit="handleTaskFormSubmit" @deleteTask="deleteTask">-->
<!--          </TaskItemCard>-->
<!--        </template>-->
<!--        <template v-else-if="project.tasks.length > 0 && project.tasks.length === tasksCompleted.length">-->
<!--          <EmptyListDisplay message="You completed all the tasks for this project!">-->
<!--            <template #img>-->
<!--              <img src="../../../assets/all_task_completed.svg" alt="All tasks completed">-->
<!--            </template>-->
<!--          </EmptyListDisplay>-->
<!--        </template>-->
<!--        <template v-else>-->
<!--          <EmptyListDisplay message="No task are related to this project">-->
<!--            <template #img>-->
<!--              <img src="../../../assets/no_tasks.svg" alt="No tasks">-->
<!--            </template>-->
<!--          </EmptyListDisplay>-->
<!--        </template>-->


<!--        <template v-if="project.tasks.length > 0 && !(project.tasks.length === 1 && createTaskDisplayed)">-->
<!--          <h3 class="mt-7 mb-3 ml-2">Tasks completed</h3>-->
<!--          <template v-if="tasksCompleted.length > 0">-->
<!--            <TaskItemCard v-for="task in tasksCompleted" :key="'task-completed-' + task.id" :task="task"-->
<!--                          :disabled="project.archived" @toggleTaskState="toggleTaskState"-->
<!--                          @toggleEditMode="toggleTaskEditMode" @taskFormSubmit="handleTaskFormSubmit"-->
<!--                          @deleteTask="deleteTask">-->
<!--            </TaskItemCard>-->
<!--          </template>-->
<!--          <template v-else>-->
<!--            <EmptyListDisplay message="You didn't complete any task for this project yet">-->
<!--              <template #img>-->
<!--                <img src="../../../assets/no-task-completed.svg" alt="No tasks completed">-->
<!--              </template>-->
<!--            </EmptyListDisplay>-->
<!--          </template>-->
<!--        </template>-->

<!--      </v-col>-->
<!--      <v-col cols="4">-->
<!--        <div class="d-flex justify-center mt-3">-->
<!--          <v-progress-circular :value="percentageOfTaskCompleted" :color="colorOfProgressTaskCompleted"-->
<!--                               :rotate="-90" :size="200" :width="20">-->
<!--            <div>-->
<!--              <span style="font-size: 2.5em;">{{ tasksCompleted.length }}</span>-->
<!--              /-->
<!--              <span style="font-size: 1em; transform: translateY(0.3em); display: inline-block">-->
<!--                {{ totalTask }}-->
<!--              </span>-->
<!--            </div>-->
<!--          </v-progress-circular>-->
<!--        </div>-->
<!--        <v-card class="mt-5">-->
<!--          <v-card-title>Description</v-card-title>-->
<!--          <v-card-text>-->
<!--            {{ project.description }}-->
<!--          </v-card-text>-->
<!--        </v-card>-->
<!--      </v-col>-->
<!--    </v-row>-->
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import {projectService} from "@/api/project.api";
import TaskItemCard from "@/views/project/components/TaskItemCard.vue";
import {taskService} from "@/api/task.api";
import {TaskDisplayModel} from "@/models/task.model";
import ProjectFormDialog from "@/views/project/components/ProjectFormDialog.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import EmptyListDisplay from "@/components/EmptyListDisplay.vue";
import {ProjectModel} from "@/models/project.model";
import ProjectDescription from "@/views/project/project-detail/tabs/ProjectDescription.vue";
import ProjectSection from "@/views/project/project-detail/tabs/ProjectSection.vue";
import ProjectConfiguration from "@/views/project/project-detail/tabs/ProjectConfiguration.vue";
import ProjectCompletedTasks from "@/views/project/project-detail/tabs/ProjectCompletedTasks.vue";

@Component({
  components: {
    ProjectCompletedTasks,
    ProjectConfiguration,
    ProjectSection,
    ProjectDescription,
    ProjectFormDialog,
    TaskItemCard,
    ConfirmDialog,
    EmptyListDisplay
  }
})
export default class ProjectDetail extends Vue {
  @Prop() private projectId!: number;

  private project!: ProjectModel = null;

  private projectTab = 'description';

  private projectEditDialog = false;
  private projectArchiveDialog = false;
  private projectDeleteDialog = false;

  private createTaskDisplayed = false;
  private editTasksDisplay = false;

  get tasksUncompleted(): TaskDisplayModel[] {
    return this.project.tasks.filter((task: TaskDisplayModel) => !task.completed);
  }

  get tasksCompleted(): TaskDisplayModel[] {
    return this.project.tasks.filter((task: TaskDisplayModel) => task.completed);
  }

  get totalTask(): number {
    return this.project.tasks.filter((task: TaskDisplayModel) => !!task.id).length;
  }

  get percentageOfTaskCompleted(): number {
    return (this.tasksCompleted.length / this.totalTask) * 100;
  }

  get colorOfProgressTaskCompleted(): string {
    const colorArray = ['green lighten-4', 'green lighten-3', 'green lighten-2', 'green lighten-1', 'green'];
    const index = Math.trunc(this.percentageOfTaskCompleted * colorArray.length / 100) - 1;
    return colorArray[index];
  }

  created(): void {
    this.retrieveProject();
  }

  @Watch('createTaskDisplayed')
  private onCreateTaskDisplayedChanges(value: boolean): void {
    if (value) {
      this.project.tasks.unshift({editMode: true} as TaskDisplayModel);
    } else {
      // Delete first task if it has no id
      if (!this.project.tasks[0].id) {
        this.project.tasks.shift();
      }
    }
  }

  @Watch('editTasksDisplay')
  private onEditTasksDisplay(value: boolean): void {
    if (!value) {
      this.disableAllCreatedTasksEditMode();
    }
  }

  private disableAllCreatedTasksEditMode(): void {
    this.project.tasks.filter((task: TaskDisplayModel) => task.id && task.editMode).forEach((task: TaskDisplayModel) => {
      task.editMode = false;
    });
  }

  private toggleTaskEditMode(task: TaskDisplayModel, value: boolean): void {
    // handle close create task card
    if (!task.id && !value) {
      this.createTaskDisplayed = false;
      return;
    }

    // Only one card can be in editMode
    this.disableAllCreatedTasksEditMode();
    task.editMode = value;
  }

  private retrieveProject(): void {
    projectService.getProjectById(this.projectId).then(
        (response: any) => {
          this.project = response.body;
          this.project.tasks.forEach((task: TaskDisplayModel) => {
            // Set all task to editMode false with the Vue reactivity $set function
            this.$set(task, 'editMode', false);
          });
        }, (error: any) => {
          console.error(error);
          this.$router.push({name: 'project-list'});
        }
    );
  }

  private updateProject(projectForm: Partial<ProjectModel>): void {
    this.projectEditDialog = false;
    projectService.updateProject(this.project.id, projectForm).then(
        (response: any) => {
          this.project.name = response.body.name;
          this.project.description = response.body.description;
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private toggleProjectArchive(): void {
    this.projectArchiveDialog = false;
    projectService.updateProject(this.project.id, {archived: !this.project.archived}).then(
        (response: any) => {
          this.project.archived = response.body.archived;
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private deleteProject(): void {
    this.projectDeleteDialog = false;
    projectService.deleteProject(this.project.id).then(
        () => {
          this.$router.push({name: 'project-list', query: {archived: 'true'}});
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private handleTaskFormSubmit(taskId: number, taskForm: Partial<TaskDisplayModel>): void {
    if (taskId) {
      this.updateTask(taskId, taskForm);
    } else {
      this.createTask(taskForm);
    }
  }

  private toggleTaskState(taskId: number): void {
    const task = this.project.tasks.find((task: TaskDisplayModel) => task.id === taskId);
    if (!task) {
      return;
    }

    taskService.updateTaskById(taskId, {completed: !task.completed} as TaskDisplayModel).then(
        (response: any) => {
          task.completed = response.body.completed
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private createTask(taskForm: Partial<TaskDisplayModel>): void {
    taskForm.projectId = this.project.id;
    taskService.createTask(taskForm).then(
        (response: any) => {
          this.$set(this.project.tasks, 0, Object.assign({editMode: false}, response.body));
          this.createTaskDisplayed = false;
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
        () => {
          const taskIndex = this.project.tasks.findIndex((task: TaskDisplayModel) => task.id === taskId);
          if (taskIndex !== -1) {
            this.project.tasks.splice(taskIndex, 1);
          }
        }, (error: any) => {
          console.error(error);
        }
    )
  }
}
</script>

<style scoped lang="scss">

</style>