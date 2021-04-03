<template>
  <v-card>
    <v-card-title v-if="collection">Update collection</v-card-title>
    <v-card-title v-else>New collection</v-card-title>
    <v-card-text>
      <v-form ref="form" v-model="collectionForm.valid" @submit.prevent="emitSubmitEvent">
        <v-row>
          <v-col>
            <v-text-field v-model="collectionForm.data.name" label="Name" counter="50" maxlength="50" required
                          :rules="collectionForm.rules.name" :autofocus="!collection">
            </v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-textarea v-model="collectionForm.data.description" label="Description" counter="500" maxlength="500"
                        required :rules="collectionForm.rules.description" rows="1" auto-grow>
            </v-textarea>
          </v-col>
        </v-row>
        <v-card-actions class="d-flex justify-end mt-3">
          <v-btn color="success" small :disabled="!collectionForm.valid" @click="emitSubmitEvent">
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
import {CollectionModel} from "@/models/collection.model";

// Todo : only send data that has changed
@Component
export default class CollectionFormDialog extends Vue {
  @Prop() private isDialogOpen!: boolean;
  @Prop() private collection!: CollectionModel;

  private collectionForm = {
    valid: false,
    data: {
      name: '',
      description: '',
    },
    rules: {
      name: [(value: string) => !!value || 'Collection name is required', (value: string) => value.length <= 50 || 'Max 50 characters'],
      description: [(value: string) => !!value || 'Collection description is required', (value: string) => value.length <= 500 || 'Max 500 characters'],
    }
  }

  get form(): Vue & { resetValidation: () => void } {
    return this.$refs.form as Vue & { resetValidation: () => void };
  }

  beforeMount(): void {
    if (this.collection) {
      this.populateForm(this.collection);
    }
  }

  @Watch('isDialogOpen')
  private onIsDialogOpenChanges(value: boolean): void {
    if (value) {
      this.form.resetValidation();
      if (this.project) {
        this.populateForm(this.collection);
      } else {
        this.populateForm({name: '', description: ''} as CollectionModel);
      }
    }
  }

  private populateForm({name, description}: CollectionModel): void {
    this.collectionForm.data.name = name;
    this.collectionForm.data.description = description;
  }

  private emitSubmitEvent(): void {
    if (!this.collectionForm.valid) {
      return;
    }
    this.$emit('submit', this.collectionForm.data);
  }

  private emitCloseEvent(): void {
    this.$emit('close');
  }
}
</script>

<style scoped lang="scss">

</style>