<template>
  <v-card class="mb-4" @click="toggleTaskState">
    <template v-if="editMode">
      <v-card-text>
        <v-form v-model="taskForm.valid">
          <v-row align-content="center">
            <v-col cols="10">
              <v-text-field v-model="taskForm.data.name" label="Name" counter="50" maxlength="50" required
                            :rules="taskForm.rules.name"></v-text-field>
            </v-col>
            <v-col cols="2" class="d-flex align-center">
              <v-checkbox v-model="taskForm.data.priority" :true-value="1" :false-value="0" label="Important" hide-details
                          class="mt-0"></v-checkbox>
            </v-col>
          </v-row>
          <v-card-actions class="d-flex justify-end">
            <v-btn color="success" small :disabled="!taskForm.valid" @click="submitTaskForm()">
              <v-icon>mdi-check</v-icon>
            </v-btn>
            <v-btn color="error" small class="ml-1" @click="editMode = false">
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
            <v-icon color="error" v-show="task.priority === priority.IMPORTANT">mdi-alert-decagram</v-icon>
          </v-col>
          <v-col cols="10">
            <h3>{{ task.name }}</h3>
          </v-col>
          <v-col cols="1" v-if="!displayEditBtn">
            <v-checkbox color="success" hide-details :input-value="task.completed" class="mt-0"></v-checkbox>
          </v-col>
          <v-col cols="1" class="d-flex justify-center" v-else>
            <v-btn icon color="accent" small @click.stop="editMode = true">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-dialog width="40%" v-model="deleteDialog">
              <template #activator="{ on, attrs }">
                <v-btn icon color="error" small v-bind="attrs" v-on="on" class="ml-3">
                  <v-icon>mdi-trash-can</v-icon>
                </v-btn>
              </template>
              <v-card class="grey darken-1">
                <v-card-title class="headline">
                  Are you sure to delete this task ?
                </v-card-title>
                <v-card-text>
                  <div class="d-flex justify-center">
                    <v-btn color="success" large class="mr-2" @click="deleteTask">Yes</v-btn>
                    <v-btn color="error" large @click="deleteDialog = false">No</v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-dialog>
          </v-col>
        </v-row>
      </v-card-text>
    </template>
  </v-card>

</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import TaskModel from "@/models/task/task.model";
import {PriorityEnum} from "@/models/project/priority.enum";

@Component
export default class TaskItemCard extends Vue {
  @Prop() private task!: TaskModel;
  @Prop() private displayEditBtn!: boolean;
  private priority = PriorityEnum;
  private editMode = false;
  private deleteDialog = false;

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

  private toggleTaskState(): void {
    if (!this.editMode && !this.displayEditBtn) {
      this.$emit('toggleTaskState', this.task.id);
    }
  }

  @Watch('editMode')
  onEditModeChanged(value: boolean) {
    if (value) {
      this.taskForm.data.name = this.task.name;
      this.taskForm.data.priority = this.task.priority;
    }
  }

  private submitTaskForm(): void {
    this.$emit('updateTask', this.task.id, this.taskForm.data);
    this.editMode = false;
  }

  private deleteTask(): void {
    this.deleteDialog = false;
    this.$emit('deleteTask', this.task.id);1
  }
}
</script>

<style scoped>

</style>