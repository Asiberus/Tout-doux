<template>
  <div>
    <h2 class="mb-3 ml-2">Projects</h2>
    <div class="project-wrapper">
      <template v-if="projectList.length">
        <v-row align-content="start" class="position-relative">
          <v-col v-for="project in projectList" :key="'project-' + project.id" cols="3"
                 :class="{selected: project.selected}">
            <v-card v-on="!project.selected ? {click: () => selectProject(project)}: {}"
                    :disabled="project.tasks.length === 0" :title="!project.selected ? 'Open project' : null">
              <v-progress-linear :value="percentageOfTaskCompleted(project)" color="green accent-2"
                                 height="4">
              </v-progress-linear>
              <v-card-text>
                <div class="d-flex justify-space-between align-center project-card-header">
                  <h3 class="white--text">
                    <span v-if="project.selected" class="grey--text">Select task of the project : </span>
                    {{ project.name }}
                  </h3>
                  <div class="mx-3" v-if="!project.selected">
                    <span style="font-size: 1.8em;" class="white--text">{{ numberOfTasksCompleted(project) }}</span>
                    /
                    <span style="font-size: 1.1em; transform: translateY(0.3em); display: inline-block">
                      {{ project.tasks.length }}
                    </span>
                  </div>
                  <v-btn v-if="project.selected" @click.stop="project.selected = false" color="red" icon>
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>
                <template v-if="project.selected">
                  <v-divider class="my-3"></v-divider>
                  <template v-if="taskUncompleted(project).length">
                    <v-row align-content="start" class="task-wrapper">
                      <v-col v-for="task of taskUncompleted(project)" :key="'project-task-' + task.id" cols="6">
                        <v-card @click="selectTask(task)" :disabled="isTaskSelected(task)"
                                :color="isTaskSelected(task) ? 'taskCompleted' : '#212121'" elevation="5"
                                title="Select task">
                          <v-card-text class="p-1">
                            <h5 class="white--text">
                              {{ task.name }}
                            </h5>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </template>
                  <template v-else>
                    <EmptyListDisplay message="No task are related to this project">
                      <template #img>
                        <img src="../../../../assets/no_tasks.svg" alt="No tasks" height="150">
                      </template>
                    </EmptyListDisplay>
                  </template>
                </template>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </template>
      <template v-else>
        <EmptyListDisplay message="No projects available">
          <template #img>
            <img src="../../../../assets/project.svg" alt="No tasks" height="250">
          </template>
        </EmptyListDisplay>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import EmptyListDisplay from "@/components/EmptyListDisplay.vue";
import {DailyTaskProjectDisplayModel} from "@/models/project.model";
import {DailyTaskModel} from "@/models/daily-task.model";
import {TaskModel} from "@/models/task.model";

// Todo : add btn to create project in no project svg
@Component({
  components: {
    EmptyListDisplay
  }
})
export default class DailyTaskUpdateProjectList extends Vue {
  @Prop() private projectList!: DailyTaskProjectDisplayModel[];
  @Prop() private dailyTaskList!: DailyTaskModel[];

  get taskUncompleted(): (item: DailyTaskProjectDisplayModel) => TaskModel[] {
    return (item: DailyTaskProjectDisplayModel) => item.tasks.filter((task: TaskModel) => !task.completed);
  }

  // todo : change color of task selected
  get isTaskSelected(): (task: TaskModel) => boolean {
    return (task: TaskModel) => this.dailyTaskList.some((dailyTask: DailyTaskModel) => task.id === dailyTask.taskId);
  }

  get numberOfTasksCompleted(): (item: DailyTaskProjectDisplayModel) => number {
    return (item: DailyTaskProjectDisplayModel) => item.tasks.filter((task: TaskModel) => task.completed).length;
  }

  get percentageOfTaskCompleted(): (item: DailyTaskProjectDisplayModel) => number {
    return (item: DailyTaskProjectDisplayModel) => (this.numberOfTasksCompleted(item) / item.tasks.length) * 100;
  }

  private selectProject(project: DailyTaskProjectDisplayModel): void {
    project.selected = true;
  }

  private selectTask(task: TaskModel): void {
    this.$emit('selectTask', {taskId: task.id});
  }
}
</script>

<style scoped lang="scss">
.position-relative {
  position: relative;
  height: 100%;
}

.project-wrapper {
  height: 20rem;

  .selected {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    max-width: 100%;
    z-index: 1;

    .v-card {
      height: 100%;

      .v-card__text {
        height: 100%;

        .project-card-header {
          height: 15%;
        }

        .task-wrapper {
          height: 80%;
          overflow-y: auto;
        }
      }
    }
  }
}
</style>
