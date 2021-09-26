<template>
  <div class="mb-2">
    <v-card @click.stop="taskDialog = true"
            :color="backgroundColor">
      <v-card-text>
        <v-row align-content="center">
          <v-col cols="11" class="d-flex align-center">
            <h3 class="ml-2 white--text font-weight-regular">
              {{ task.name }}
            </h3>
          </v-col>

          <v-col cols="1">
            <v-checkbox v-if="!disabled" color="success" hide-details :input-value="task.completed"
                        @click.native.prevent.stop.capture="emitToggleStateEvent"
                        class="mt-0">
            </v-checkbox>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-dialog v-model="taskDialog" width="60%">
      <TaskDialog :task="task" :is-dialog-open="taskDialog"
                  @submit="emitUpdateEvent" @delete="emitDeleteEvent"
                  @close="taskDialog = false">
      </TaskDialog>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import {TaskModel} from "@/models/task.model";
import TaskDialog from "@/views/project/components/TaskDialog.vue";

@Component({
  components: {
    TaskDialog
  }
})
export default class TaskItemCard extends Vue {
  @Prop() private task!: TaskModel;
  @Prop() private disabled!: boolean;

  private taskDialog = false;

  get backgroundColor(): string | null {
    if (this.task.completed) {
      return 'taskCompleted';
    } else if (!this.task.id) {
      return 'taskInCreation';
    }
    return null;
  }

  private emitToggleStateEvent(): void {
    this.$emit('toggleState', this.task.id, !this.task.completed);
  }

  private emitUpdateEvent(data: Partial<TaskModel>): void {
    this.taskDialog = false;
    this.$emit('update', this.task.id, data);
  }

  private emitDeleteEvent(): void {
    this.taskDialog = false;
    this.$emit('delete', this.task.id);
  }
}
</script>

<style scoped>

</style>
