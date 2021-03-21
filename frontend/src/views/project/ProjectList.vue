<template>
  <v-container>
    <h1 class="mb-6">Project List</h1>
    <div>
      <v-dialog v-model="projectDialog" width="60%">
        <template #activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" class="float-right">
            <v-icon left>mdi-plus</v-icon>
            Add a project
          </v-btn>
        </template>
        <ProjectFormDialog :isDialogOpen="projectDialog" @submit="createProject"
                           @close="projectDialog = false"></ProjectFormDialog>
      </v-dialog>

    </div>
    <v-row>
      <v-col v-for="project in projectList" :key="project.id" cols="4">
        <v-card rounded :to="{name: 'project-detail', params: {id: project.id}}">
          <v-progress-linear :value="projectPercentageOfTaskCompleted(project)" color="green accent-2"
                             height="6"></v-progress-linear>
          <v-card-text class="d-flex justify-space-between align-center">
            <div class="d-flex flex-column justify-center">
              <h1 class="white--text mt-1">{{ project.name }}
                <v-icon v-if="project.priority === priorityEnum.IMPORTANT" color="error" dense>mdi-alert-decagram</v-icon>
              </h1>
              <p class="mb-0 mt-3 ml-2">{{ project.description }}</p>
            </div>
            <div class="pr-7">
              <span style="font-size: 2.5em;" class="white--text">{{ projectTasksCompleted(project) }}</span>
              /
              <span style="font-size: 1.5em; transform: translateY(0.3em); display: inline-block">
                {{ project.tasks.length }}
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import ProjectModel from "@/models/project/project.model";
import {projectService} from "@/api/project.api";
import {TaskDisplayModel} from "@/models/task/task.model";
import ProjectFormDialog from "@/views/project/components/ProjectFormDialog.vue";
import {PriorityEnum} from "@/models/project/priority.enum";

@Component({
  components: {
    ProjectFormDialog
  }
})
export default class ProjectList extends Vue {
  private projectList: ProjectModel[] = [];
  private projectDialog = false;
  private priorityEnum = PriorityEnum;

  get projectTasksCompleted(): (project: ProjectModel) => number {
    return (project: ProjectModel) => {
      return project.tasks.filter((task: TaskDisplayModel) => task.completed).length;
    }
  }

  get projectPercentageOfTaskCompleted(): (project: ProjectModel) => number {
    return (project: ProjectModel) => {
      return (this.projectTasksCompleted(project) / project.tasks.length) * 100;
    }
  }

  created(): void {
    this.retrieveProjectList();
  }

  private retrieveProjectList(): void {
    projectService.getProjectList().then(
        (response: any) => {
          this.projectList = response.body.content;
        },
        (error: any) => {
          console.error(error);
        }
    )
  }

  private createProject(projectForm: Partial<ProjectModel>): void {
    this.projectDialog = false;
    projectService.createProject(projectForm).then(
        (response: any) => {
          this.projectList.unshift(response.body);
        }, (error: any) => {
          console.error(error);
        }
    )
  }

}
</script>

<style scoped lang="scss">

</style>