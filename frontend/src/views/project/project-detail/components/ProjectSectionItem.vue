<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-3">
      <h3>{{ section.name }}</h3>
      <div>
        <v-dialog v-model="taskDialog" width="60%">
          <template #activator="{ attrs, on }">
            <v-btn v-bind="attrs" v-on="on" :disabled="disabled">
              <v-icon>mdi-plus</v-icon>
              task
            </v-btn>
          </template>
          <TaskDialog :is-dialog-open="taskDialog"
                      @submit="createTask"
                      @close="taskDialog = false"
          >
          </TaskDialog>
        </v-dialog>
      </div>
    </div>
    <v-row class="mb-3">
      <v-col cols="9">
        <TaskItemCard v-for="task in taskUncompleted" :key="task.id"
                      :task="task" :disabled="disabled"
                      @toggleState="toggleTaskState"
                      @update="updateTask"
                      @delete="deleteTask">
        </TaskItemCard>
      </v-col>
      <v-col cols="3">
        <div class="d-flex align-center justify-center">
          <ProgressCircular :value="taskCompletedLength" :max="section.tasks.length"
                            :size="180" :width="15">
          </ProgressCircular>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {taskService} from '@/api/task.api';
import ProgressCircular from '@/components/ProgressCircular.vue';
import {TaskModel} from '@/models/task.model';
import TaskDialog from '@/views/project/components/TaskDialog.vue';
import TaskItemCard from '@/views/project/components/TaskItemCard.vue';
import {Component, Prop, Vue} from "vue-property-decorator";
import {SectionModel} from "@/models/section.model";

@Component({
  components: {
    TaskItemCard,
    TaskDialog,
    ProgressCircular,
  }
})
export default class ProjectSectionItem extends Vue {
  @Prop() section!: SectionModel;
  @Prop() disabled!: boolean;

  taskDialog = false;

  get taskCompletedLength(): number {
    return this.section.tasks.filter((task: TaskModel) => task.completed).length;
  }

  get taskUncompleted(): TaskModel[] {
    return this.section.tasks.filter((task: TaskModel) => !task.completed)
  }

  private createTask(data: Partial<TaskModel>): void {
    this.taskDialog = false;
    data.sectionId = this.section.id;
    taskService.createTask(data).then(
            response => {
              this.section.tasks.unshift(response.body);
            }, error => {
              console.error(error);
            }
    )
  }

  private toggleTaskState(taskId: number, completed: boolean): void {
    taskService.updateTaskById(taskId, {completed}).then(
            (response: any) => {
              const task = this.section.tasks.find((task: TaskModel) => task.id === response.body.id);
              if (task) {
                task.completed = response.body.completed;
              }
            }
    )
  }

  private updateTask(taskId: number, data: Partial<TaskModel>): void {
    taskService.updateTaskById(taskId, data).then(
            (response: any) => {
              const task = this.section.tasks.find((task: TaskModel) => task.id === response.body.id)
              Object.assign(task, response.body)
            }
    )
  }

  private deleteTask(taskId: number): void {
    taskService.deleteTaskById(taskId).then(
            () => {
              const taskIndex = this.section.tasks.findIndex((task: TaskModel) => task.id === taskId);
              if (taskIndex !== -1) {
                this.section.tasks.splice(taskIndex, 1);
              }
            }, (error: any) => {
              console.error(error);
            }
    )
  }
}
</script>

<style scoped lang="scss">

</style>
