<template>
  <v-card rounded :to="{name: 'project-detail', params: {id: project.id}}" :color="project.archived ? 'projectArchived' : null">
    <v-progress-linear :value="projectPercentageOfTaskCompleted" color="green accent-2"
                       height="6">
    </v-progress-linear>
    <v-card-text class="d-flex justify-space-between align-center">
      <div class="d-flex flex-column justify-center">
        <h1 class="white--text mt-1">{{ project.name }}
          <v-icon v-if="project.priority === priorityEnum.IMPORTANT" color="error" dense>mdi-alert-decagram</v-icon>
        </h1>
        <p class="mb-0 mt-3 ml-2">{{ ellipsis(project.description, 50) }}</p>
      </div>
      <div class="pr-7">
        <span style="font-size: 2.5em;" class="white--text">{{ projectTasksCompleted }}</span>
        /
        <span style="font-size: 1.5em; transform: translateY(0.3em); display: inline-block">
                {{ project.tasks.length }}
              </span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import ProjectModel from "../../../models/project/project.model";
import {TaskDisplayModel} from "@/models/task/task.model";
import {PriorityEnum} from "@/models/project/priority.enum";
import ellipsis from "@/filters/ellipsis";

@Component
export default class ProjectItemCard extends Vue {
  @Prop() private project!: ProjectModel;
  private priorityEnum = PriorityEnum;

  get projectTasksCompleted(): number {
    return this.project.tasks.filter((task: TaskDisplayModel) => task.completed).length;
  }

  get projectPercentageOfTaskCompleted(): number {
    return (this.projectTasksCompleted / this.project.tasks.length) * 100;
  }

  private ellipsis(value: string, numberOfCharacter: number): string {
    return ellipsis(value, numberOfCharacter);
  }
}
</script>

<style scoped lang="scss">

</style>