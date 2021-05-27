<template>
  <v-card>
    <v-card-title v-if="project">Update project</v-card-title>
    <v-card-title v-else>New project</v-card-title>
    <v-card-text>
      <v-form ref="form" v-model="projectForm.valid" @submit.prevent="emitSubmitEvent">
        <v-row>
          <v-col>
            <v-text-field v-model="projectForm.data.name" label="Name" counter="50" maxlength="50" required
                          :rules="projectForm.rules.name" :autofocus="!project">
            </v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-textarea v-model="projectForm.data.description" label="Description" counter="500" maxlength="500"
                        required :rules="projectForm.rules.description" rows="1" auto-grow>
            </v-textarea>
          </v-col>
        </v-row>
        <v-card-actions class="d-flex justify-end mt-3">
          <v-btn color="success" small :disabled="!projectForm.valid" @click="emitSubmitEvent">
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
import {ProjectModel} from "@/models/project.model";


// Todo : add handler of ctrl + enter to submit form in textearea
@Component
export default class ProjectFormDialog extends Vue {
  @Prop() private isDialogOpen!: boolean;
  @Prop() private project!: ProjectModel;

  private projectForm = {
    valid: false,
    data: {
      name: '',
      description: '',
    },
    rules: {
      name: [(value: string) => !!value || 'Project name is required', (value: string) => value.length <= 50 || 'Max 50 characters'],
      description: [(value: string) => !!value || 'Project description is required', (value: string) => value.length <= 500 || 'Max 500 characters'],
    }
  }

  get form(): Vue & { resetValidation: () => void } {
    return this.$refs.form as Vue & { resetValidation: () => void };
  }

  beforeMount(): void {
    if (this.project) {
      this.populateForm(this.project);
    }
  }

  @Watch('isDialogOpen')
  private onIsDialogOpenChanges(value: boolean): void {
    if (value) {
      this.form.resetValidation();
      if (this.project) {
        this.populateForm(this.project);
      } else {
        this.populateForm({name: '', description: ''} as ProjectModel);
      }
    }
  }

  private populateForm({name, description}: ProjectModel): void {
    this.projectForm.data.name = name;
    this.projectForm.data.description = description;
  }

  private emitSubmitEvent(): void {
    if (!this.projectForm.valid) {
      return;
    }
    this.$emit('submit', this.projectForm.data);
  }

  private emitCloseEvent(): void {
    this.$emit('close');
  }
}
</script>

<style scoped lang="scss">

</style>