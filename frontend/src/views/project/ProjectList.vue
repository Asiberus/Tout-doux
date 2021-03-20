<template>
  <v-container>
    <h1 class="mb-6">Project List</h1>
    <v-row>
      <v-col v-for="project in projectList" :key="project.id" cols="4">
        <v-card rounded :to="{name: 'project-detail', params: {id: project.id}}">
          <v-card-title>{{ project.name }}</v-card-title>
          <v-card-text>{{ project.description }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import ProjectModel from "@/models/project/project.model";
import {projectService} from "@/api/project.api";

@Component
export default class ProjectList extends Vue {

  private projectList: ProjectModel[] = [];

  created(): void {
    this.retrieveProjectList();
  }

  private retrieveProjectList(): void {
    console.log('retrieve project list');
    projectService.getProjectList().then(
        (response: any) => {
          this.projectList = response.body.content;
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