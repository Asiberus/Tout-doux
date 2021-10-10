<template>
  <v-container>
    <v-row class="mt-3">
      <v-col cols="2">
        <v-tabs v-model="configurationTab" vertical background-color="transparent" color="accent">
          <v-tab href="#general">
            <v-icon left small>mdi-cog</v-icon>
            General
          </v-tab>
          <v-tab disabled>
            <v-icon left small>mdi-tag</v-icon>
            Tags
          </v-tab>
          <v-tab disabled>
            <v-icon left small>mdi-account</v-icon>
            User
          </v-tab>
        </v-tabs>
      </v-col>
      <v-col>
        <v-tabs-items v-model="configurationTab" class="transparent">
          <v-tab-item value="general" :transition="false">
            <div class="d-flex justify-end align-center mb-3">
              <v-dialog v-model="archiveProjectDialog" width="50%">
                <template #activator="{ attrs, on }">
                  <v-btn v-bind="attrs" v-on="on" :outlined="!project.archived" color="accent mr-3">
                    <v-icon small left>mdi-archive</v-icon>
                    {{ project.archived ? 'archived' : 'archive' }}
                  </v-btn>
                </template>
                <ConfirmDialog color="accent"
                               @confirm="toggleProjectArchiveState"
                               @cancel="archiveProjectDialog = false"
                >
                  <template #icon>
                    <v-icon x-large>mdi-archive</v-icon>
                  </template>
                  <p>Are you sure to {{ this.project.archived ? 'unarchive' : 'archive' }} this project ?</p>
                </ConfirmDialog>
              </v-dialog>
              <template v-if="project.archived">
                <v-dialog v-model="deleteProjectDialog" width="50%">
                  <template #activator="{ attrs, on }">
                    <v-btn v-bind="attrs" v-on="on" color="error">
                      <v-icon small left>mdi-trash-can</v-icon>
                      delete
                    </v-btn>
                  </template>
                  <ConfirmDialog color="error"
                                 @confirm="deleteProject"
                                 @cancel="deleteProjectDialog = false"
                  >
                    <template #icon>
                      <v-icon x-large>mdi-trash-can</v-icon>
                    </template>
                    <p>Are you sure to delete this project ?</p>
                    <p class="mb-0 font-italic" style="font-size: 1.1rem;">All related tasks will be deleted</p>
                  </ConfirmDialog>
                </v-dialog>
              </template>
            </div>
            <v-row>
              <v-col cols="10">
                <v-form ref="form" v-model="projectForm.valid" @submit.prevent="updateProject">
                  <v-text-field v-model="projectForm.data.name" label="Name" counter="50" maxlength="50" required
                                :rules="projectForm.rules.name" :disabled="project.archived">
                  </v-text-field>
                  <v-textarea v-model="projectForm.data.description" label="Description" counter="500" maxlength="500"
                              required :rules="projectForm.rules.description" rows="2" auto-grow class="my-5"
                              :disabled="project.archived">
                  </v-textarea>
                  <div v-if="!project.archived" class="float-right mt-5">
                    <v-btn color="success" :disabled="!projectForm.valid || isFormUntouched" @click="updateProject">
                      update
                    </v-btn>
                  </div>
                </v-form>
              </v-col>
            </v-row>

          </v-tab-item>
          <v-tab-item value="tag" :transition="false"/>
          <v-tab-item value="user" :transition="false"/>
        </v-tabs-items>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import {ProjectModel} from "@/models/project.model";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import {projectService} from "@/api/project.api";

@Component({
  components: {
    ConfirmDialog
  }
})
export default class ProjectConfiguration extends Vue {
  @Prop() project!: ProjectModel;
  @Prop() tab!: string;

  private configurationTab = 'general';
  private archiveProjectDialog = false;
  private deleteProjectDialog = false;

  private projectForm = {
    valid: false,
    data: {
      name: this.project.name,
      description: this.project.description
    },
    rules: {
      name: [(value: string) => !!value || 'Project name is required', (value: string) => value.length <= 50 || 'Max 50 characters'],
      description: [(value: string) => !!value || 'Project description is required', (value: string) => value.length <= 500 || 'Max 500 characters'],
    }
  }

  get isFormUntouched(): boolean {
    return this.projectForm.data.name === this.project.name && this.projectForm.data.description === this.project.description;
  }

  get form(): Vue & { resetValidation: () => void } {
    return this.$refs.form as Vue & { resetValidation: () => void };
  }

  @Watch('tab')
  private onTabChanges(value: string): void {
    if (value === 'configuration') {
      this.form.resetValidation();
      this.projectForm.data.name = this.project.name;
      this.projectForm.data.description = this.project.description;
    }
  }

  private toggleProjectArchiveState(): void {
    this.archiveProjectDialog = false;
    projectService.updateProject(this.project.id, {archived: !this.project.archived}).then(
        response => {
          this.project.archived = response.body.archived
        },
        error => {
          console.error(error)
        }
    );
  }

  private updateProject(): void {
    projectService.updateProject(this.project.id, this.projectForm.data).then(
        response => {
          this.project.name = response.body.name;
          this.project.description = response.body.description;
        }, error => {
          console.error(error);
        }
    )
  }

  private deleteProject(): void {
    this.deleteProjectDialog = false;
    projectService.deleteProject(this.project.id).then(
        () => {
          this.$router.push({name: 'project-list'});
        }, error => {
          console.error(error);
        }
    );
  }

}
</script>

<style scoped lang="scss">

</style>
