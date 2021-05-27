<template>
  <v-container>
    <v-row class="mt-3">
      <v-col cols="9">
        <h3 class="mb-3">Description</h3>
        <v-card >
          <v-card-text>
            {{ project.description }}
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="3">
        <div class="d-flex justify-center mt-3">
          <v-progress-circular :value="percentageOfTaskCompleted" :color="colorOfProgressTaskCompleted"
                               :rotate="-90" :size="200" :width="20">
            <div>
              <span style="font-size: 2.5em;">{{ tasksCompleted.length }}</span>
              /
              <span style="font-size: 1em; transform: translateY(0.3em); display: inline-block">
                {{ totalTask }}
              </span>
            </div>
          </v-progress-circular>
        </div>
      </v-col>
    </v-row>

    <div class="d-flex align-center mt-12">
      <h3 class="flex-grow-1 mb-3">General Tasks</h3>
      <div>
        <v-btn icon :disabled="project.archived">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </div>
    </div>

    <v-row no-gutters>
      <v-col v-for="task in taskUncompleted" :key="task.id" cols="6" class="px-2">
        <TaskItemCard :task="task"></TaskItemCard>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import {ProjectModel} from "@/models/project.model";
import {TaskDisplayModel} from "@/models/task.model";
import TaskItemCard from "@/views/project/components/TaskItemCard.vue";
@Component({
  components: {TaskItemCard}
})
export default class ProjectDescription extends Vue {
  @Prop() project!: ProjectModel;

  get taskUncompleted(): TaskDisplayModel[] {
    return this.project.tasks.filter((task: TaskDisplayModel) => !task.completed)
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
}
</script>

<style scoped lang="scss">

</style>