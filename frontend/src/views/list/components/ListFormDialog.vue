<template>
  <v-card>
    <v-card-title v-if="list">Update list</v-card-title>
    <v-card-title v-else>New list</v-card-title>
    <v-card-text>
      <v-form ref="form" v-model="listForm.valid" @submit.prevent="emitSubmitEvent">
        <v-row>
          <v-col>
            <v-text-field v-model="listForm.data.name" label="Name" counter="50" maxlength="50" required
                          :rules="listForm.rules.name" :autofocus="!list">
            </v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-textarea v-model="listForm.data.description" label="Description" counter="500" maxlength="500"
                        required :rules="listForm.rules.description" rows="1" auto-grow>
            </v-textarea>
          </v-col>
        </v-row>
        <v-card-actions class="d-flex justify-end mt-3">
          <v-btn color="success" small :disabled="!listForm.valid" @click="emitSubmitEvent">
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
import ListModel from "@/models/list.model";

@Component
export default class ListFormDialog extends Vue {
  @Prop() private isDialogOpen!: boolean;
  @Prop() private list!: ListModel;

  private listForm = {
    valid: false,
    data: {
      name: '',
      description: '',
    },
    rules: {
      name: [(value: string) => !!value || 'List name is required', (value: string) => value.length <= 50 || 'Max 50 characters'],
      description: [(value: string) => !!value || 'List description is required', (value: string) => value.length <= 500 || 'Max 500 characters'],
    }
  }

  get form(): Vue & { resetValidation: () => void } {
    return this.$refs.form as Vue & { resetValidation: () => void };
  }

  beforeMount(): void {
    if (this.list) {
      this.populateForm(this.list);
    }
  }

  @Watch('isDialogOpen')
  private onIsDialogOpenChanges(value: boolean): void {
    if (value) {
      this.form.resetValidation();
      if (this.project) {
        this.populateForm(this.list);
      } else {
        this.populateForm({name: '', description: ''} as ListModel);
      }
    }
  }

  private populateForm({name, description}: ListModel): void {
    this.listForm.data.name = name;
    this.listForm.data.description = description;
  }

  private emitSubmitEvent(): void {
    if (!this.listForm.valid) {
      return;
    }
    this.$emit('submit', this.listForm.data);
  }

  private emitCloseEvent(): void {
    this.$emit('close');
  }
}
</script>

<style scoped lang="scss">

</style>