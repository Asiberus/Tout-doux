<template>
  <v-container>
    <h1 class="mb-6">Project List</h1>
    <div class="d-flex justify-end align-center mb-3">
      <v-chip class="mr-3" :color="archivedProjects ? 'accent' : null" @click="archivedProjects = !archivedProjects">
        <v-icon v-if="archivedProjects" small class="mr-1">
          mdi-archive
        </v-icon>
        <v-icon v-else small class="mr-1">
          mdi-checkbox-blank-outline
        </v-icon>
        Archived
      </v-chip>
      <v-dialog v-model="projectDialog" width="60%">
        <template #activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on">
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
        <ProjectItemCard :project="project"></ProjectItemCard>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Component, Vue, Watch} from "vue-property-decorator";
import ProjectModel from "@/models/project/project.model";
import {projectService} from "@/api/project.api";
import ProjectFormDialog from "@/views/project/components/ProjectFormDialog.vue";
import ProjectItemCard from "@/views/project/components/ProjectItemCard.vue";

@Component({
  components: {
    ProjectItemCard,
    ProjectFormDialog
  }
})
export default class ProjectList extends Vue {
  private projectList: ProjectModel[] = [];
  private projectDialog = false;
  private archivedProjects = true;

  created(): void {
    this.retrieveProjectList({archived: this.archivedProjects});
  }

  @Watch('archivedProjects')
  private onArchivedProjectsChanges(value: boolean): void {
    this.retrieveProjectList({archived: value});
  }

  private retrieveProjectList(params = {}): void {
    projectService.getProjectList(params).then(
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
          this.$router.push({name: 'project-detail', params: {id: response.body.id}});
        }, (error: any) => {
          console.error(error);
        }
    )
  }

}
</script>

<style scoped lang="scss">

</style>