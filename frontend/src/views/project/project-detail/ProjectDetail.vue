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

    <v-divider class="my-3"/>

    <v-tabs v-model="projectTab" background-color="transparent" color="accent">
      <v-tab href="#description">Description</v-tab>
      <v-tab href="#section">Section</v-tab>
      <v-tab disabled>Event</v-tab>
      <v-tab href="#completed-tasks">Completed Task</v-tab>
      <v-tab disabled>Historic</v-tab>
      <v-tab href="#configuration">Configuration</v-tab>
    </v-tabs>

    <v-tabs-items v-model="projectTab" class="transparent">
      <v-tab-item value="description" :transition="false">
        <ProjectDescription :project="project"/>
      </v-tab-item>
      <v-tab-item value="section" :transition="false">
        <ProjectSection :project="project"/>
      </v-tab-item>
      <v-tab-item value="event" :transition="false">
      </v-tab-item>
      <v-tab-item value="completed-tasks" :transition="false">
        <ProjectCompletedTasks :project="project"/>
      </v-tab-item>
      <v-tab-item value="configuration" :transition="false">
        <ProjectConfiguration :project="project" :tab="projectTab"/>
      </v-tab-item>
    </v-tabs-items>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import {projectService} from "@/api/project.api";
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
  }
})
export default class ProjectDetail extends Vue {
  @Prop() private projectId!: number;

  private project: ProjectModel | null = null;
  private projectTab = 'description';

  created(): void {
    this.retrieveProject();
  }

  private retrieveProject(): void {
    projectService.getProjectById(this.projectId).then(
        response => {
          this.project = response.body;
        }, error => {
          console.error(error);
          this.$router.push({name: 'project-list'});
        }
    );
  }
}
</script>

<style scoped lang="scss">

</style>
