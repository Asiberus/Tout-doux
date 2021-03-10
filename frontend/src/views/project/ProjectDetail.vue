<template>
  <v-container>
    <h1>Project : {{ project.title }}</h1>
    <v-divider class="my-3"></v-divider>
    <p>{{project.description}}</p>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import ProjectModel from "@/models/project/project.model";

@Component
export default class ProjectDetail extends Vue {
  private project: ProjectModel;

  @Prop() private projectId!: string;


  beforeMount(): void {
    this.$store.dispatch('retrieveProjectList');
    this.retrieveProject();
  }

  private retrieveProject() {
    console.log(this.projectId);
    this.project = this.$store.state.project.projectList.find(p => p.id === this.projectId);
  }
}
</script>

<style scoped lang="scss">

</style>