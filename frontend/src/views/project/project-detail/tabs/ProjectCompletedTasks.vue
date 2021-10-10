<template>
  <v-container>
    <div v-for="(taskList, index) in tasksList" :key="taskList.name + index">
      <h3 class="mb-3">{{ taskList.name }}</h3>
      <template v-if="taskList.tasks.length > 0">
        <v-row no-gutters>
          <v-col v-for="task in taskList.tasks" :key="task.id" cols="6" class="px-2">
            <TaskItemCard :task="task" :disabled="project.archived"
                          @toggleState="toggleTaskState">
            </TaskItemCard>
          </v-col>
        </v-row>
      </template>
      <template v-else>
        <EmptyListDisplay message="No tasks completed yet !" class="my-7">
          <template #img>
            <img src="../../../../assets/no-task-completed.svg" width="300" alt="No tasks completed">
          </template>
        </EmptyListDisplay>
      </template>
      <v-divider v-if="index !== tasksList.length - 1" class="my-3"/>
    </div>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import {ProjectModel} from "@/models/project.model";
import {TaskModel} from "@/models/task.model";
import TaskItemCard from "@/views/components/task/TaskItemCard.vue";
import {taskService} from "@/api/task.api";
import EmptyListDisplay from "@/components/EmptyListDisplay.vue";

@Component({
  components: {
    TaskItemCard,
    EmptyListDisplay,
  }
})
export default class ProjectCompletedTasks extends Vue {
  @Prop() project!: ProjectModel;

  get tasksList(): { name: string; tasks: TaskModel[] }[] {
    return [
      {
        name: 'General tasks',
        tasks: this.project.tasks.filter(task => task.completed)
      },
      ...this.project.sections.map(section => ({
        name: section.name,
        tasks: section.tasks.filter(task => task.completed)
      }))
    ];
  }

  private toggleTaskState(taskId: number, completed: boolean): void {
    taskService.updateTaskById(taskId, {completed}).then(
        response => {
          const task = this.project.tasks.concat(
              ...this.project.sections.map(section => section.tasks)
          ).find((task: TaskModel) => task.id === response.body.id);
          if (task) {
            task.completed = response.body.completed;
          }
        }
    )
  }
}
</script>

<style scoped lang="scss">

</style>
