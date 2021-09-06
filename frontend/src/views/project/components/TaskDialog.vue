<template>
  <v-card>
      <div class="d-flex justify-space-between align-center pa-4">
        <h2>
          {{ task ? 'Update Task' : 'New Task' }}
        </h2>
        <div v-if="task">
          <v-hover v-slot="{ hover }">
            <v-btn @click="emitDeleteTask"
                :color="hover || confirmDelete ? 'error' : null">
              {{ confirmDelete ? 'Are you sure ?' : 'Delete Task' }}
            </v-btn>
          </v-hover>
        </div>
      </div>
    <v-card-text>
      <v-form ref="form" v-model="taskForm.valid" @submit.prevent="emitSubmitEvent">
        <v-row>
          <v-col>
            <v-text-field v-model="taskForm.data.name" label="Name" counter="50" maxlength="50" requried
                          :rules="taskForm.rules.name">
            </v-text-field>
          </v-col>
        </v-row>
        <v-card-actions class="d-flex justify-end mt-3">
          <v-btn color="success" small :disabled="!taskForm.valid" @click="emitSubmitEvent">
            <v-icon>mdi-check</v-icon>
          </v-btn>
          <v-btn color="error" small class="ml-1" @click="emitCloseEvent">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import {TaskDisplayModel} from "@/models/task.model";

@Component
export default class TaskDialog extends Vue {
  @Prop() private task?: TaskDisplayModel;
  @Prop() private isDialogOpen!: boolean;

  private confirmDelete = false;

  private taskForm = {
    valid: false,
    data: {
      name: '',
    },
    rules: {
      name: [(value: string) => !!value || 'Task name is required', (value: string) => value.length <= 50 || 'Max 50 characters']
    }
  };

  get form(): Vue & { resetValidation: () => void } {
    return this.$refs.form as Vue & { resetValidation: () => void };
  }

  beforeMount(): void {
    if (this.task) {
      this.populateForm(this.task);
    }
  }

  @Watch('isDialogOpen')
  private onIsDialogOpenChanges(value: boolean): void {
    if (value) {
      this.confirmDelete = false;
      this.form.resetValidation();
      if (this.task) {
        this.populateForm(this.task);
      } else {
        this.populateForm({name: ''} as TaskDisplayModel);
      }
    }
  }

  private populateForm({ name }: TaskDisplayModel): void {
    this.taskForm.data.name = name;
  }

  private emitSubmitEvent(): void {
    if (!this.taskForm.valid) {
      return;
    }
    this.$emit('submit', this.taskForm.data);
  }

  private emitDeleteTask(): void {
    if (!this.confirmDelete) {
      this.confirmDelete = true;
      return;
    }

    this.$emit('delete');
  }

  private emitCloseEvent(): void {
    this.$emit('close');
  }
}
</script>

<style scoped lang="scss">

</style>