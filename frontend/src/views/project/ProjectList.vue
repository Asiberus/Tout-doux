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

@Component
export default class ProjectList extends Vue {

  get projectList(): ProjectModel[] {
    return this.$store.state.project.projectList;
  }

  beforeMount(): void {
    this.$store.dispatch('retrieveProjectList');
  }



}
</script>

<style scoped lang="scss">

</style>