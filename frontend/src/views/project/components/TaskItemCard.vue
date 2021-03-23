<template>
  <v-card class="mb-4" :color="backgroundColor">
    <template v-if="task.editMode">
      <v-card-text>
        <v-form v-model="taskForm.valid" @submit.prevent="emitTaskFormSubmitEvent">
          <v-row align-content="center">
            <v-col cols="10">
              <v-text-field v-model="taskForm.data.name" label="Name" counter="50" maxlength="50" required autofocus
                            :rules="taskForm.rules.name"></v-text-field>
            </v-col>
            <v-col cols="2" class="d-flex align-center">
              <v-checkbox v-model="taskForm.data.priority" :true-value="priorityEnum.IMPORTANT"
                          :false-value="priorityEnum.NORMAL" label="Important"
                          hide-details class="mt-0">
              </v-checkbox>
            </v-col>
          </v-row>
          <v-card-actions class="d-flex justify-end">
            <v-btn color="success" small :disabled="!taskForm.valid" @click="emitTaskFormSubmitEvent">
              <v-icon>mdi-check</v-icon>
            </v-btn>
            <v-btn color="error" small class="ml-1" @click="emitToggleEditModeEvent(false)">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </template>

    <template v-else>
      <v-card-text>
        <v-row align-content="center">

          <v-col cols="1" class="d-flex justify-center">
            <v-icon color="error" v-show="task.priority === priorityEnum.IMPORTANT">mdi-alert-decagram</v-icon>
          </v-col>

          <v-col cols="10">
            <h3>{{ task.name }}</h3>
          </v-col>

          <v-col cols="1" v-if="!displayEditBtn">
            <v-checkbox v-if="!disabled" color="success" hide-details :input-value="task.completed"
                        @click.native.prevent.stop.capture="emitToggleTaskStateEvent"
                        class="mt-0"></v-checkbox>
          </v-col>

          <v-col cols="1" class="d-flex justify-center" v-else>
            <v-btn icon color="accent" small @click.stop="emitToggleEditModeEvent(true)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>

            <v-dialog v-model="deleteDialog" width="50%">
              <template #activator="{ on, attrs }">
                <v-btn icon color="error" small v-bind="attrs" v-on="on" class="ml-3">
                  <v-icon>mdi-trash-can</v-icon>
                </v-btn>
              </template>
              <ConfirmDialog color="error" @confirm="emitDeleteTaskEvent" @cancel="deleteDialog = false">
                <template #icon>
                  <v-icon x-large>mdi-trash-can</v-icon>
                </template>
                <p>Are you sure to delete this task ?</p>
              </ConfirmDialog>
            </v-dialog>
          </v-col>
        </v-row>
      </v-card-text>
    </template>
  </v-card>

</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import {PriorityEnum} from "@/models/project/priority.enum";
import {TaskDisplayModel} from "@/models/task/task.model";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

@Component({
  components: {
    ConfirmDialog
  }
})
export default class TaskItemCard extends Vue {
  @Prop() private task!: TaskDisplayModel;
  @Prop() private displayEditBtn!: boolean;
  @Prop() private disabled!: boolean;

  private deleteDialog = false;
  private priorityEnum = PriorityEnum;
  private taskForm = {
    valid: false,
    data: {
      name: '',
      priority: 0,
    },
    rules: {
      name: [(value: string) => !!value || 'Task name is required', (value: string) => value.length <= 50 || 'Max 50 characters']
    }
  };

  get backgroundColor(): string | null {
    if (this.task.completed) {
      return 'taskCompleted';
    } else if (!this.task.id) {
      return 'taskInCreation';
    }
    return null;
  }

  @Watch('task.editMode', {deep: true})
  private onEditModeChanged(value: boolean): void {
    if (value) {
      this.taskForm.data.name = this.task.name || '';
      this.taskForm.data.priority = this.task.priority || 0;
    }
  }

  private emitToggleTaskStateEvent(): void {
    this.$emit('toggleTaskState', this.task.id);
  }

  private emitTaskFormSubmitEvent(): void {
    this.$emit('taskFormSubmit', this.task.id, this.taskForm.data);
  }

  private emitDeleteTaskEvent(): void {
    this.deleteDialog = false;
    this.$emit('deleteTask', this.task.id);
  }

  private emitToggleEditModeEvent(value: boolean): void {
    this.$emit('toggleEditMode', this.task, value);
  }
}
</script>

<style scoped>

</style>