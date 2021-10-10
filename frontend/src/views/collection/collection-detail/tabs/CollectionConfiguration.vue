<template>
    <v-container>
        <div class="d-flex justify-space-between align-center mb-3">
            <h3>General</h3>
            <v-dialog v-model="deleteCollectionDialog" width="50%">
                <template #activator="{ attrs, on }">
                    <v-btn v-bind="attrs" v-on="on" outlined color="error">
                        <v-icon small left>mdi-trash-can</v-icon>
                        delete
                    </v-btn>
                </template>
                <ConfirmDialog color="error"
                               @confirm="deleteCollection"
                               @cancel="deleteCollectionDialog = false"
                >
                    <template #icon>
                        <v-icon x-large>mdi-trash-can</v-icon>
                    </template>
                    <p>Are you sure to delete this collection ?</p>
                    <p class="mb-0 font-italic" style="font-size: 1.1rem;">All related tasks will be deleted</p>
                </ConfirmDialog>
            </v-dialog>
        </div>

        <v-form ref="form" v-model="collectionForm.valid" @submit.prevent="updateCollection" class="px-3">
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
            <div class="float-right mt-5">
                <v-btn color="success" :disabled="!collectionForm.valid || isFormUntouched" @click="updateCollection">
                    update
                </v-btn>
            </div>
        </v-form>
    </v-container>

</template>

<script lang="ts">
  import {collectionService} from '@/api/collection.api';
  import ConfirmDialog from '@/components/ConfirmDialog.vue';
  import {CollectionModel} from '@/models/collection.model';
  import {Component, Prop, Vue, Watch} from 'vue-property-decorator';

  @Component({
    components: {
      ConfirmDialog,
    }
  })
  export default class CollectionConfiguration extends Vue {
    @Prop() collection!: CollectionModel;
    @Prop() tab!: string;

    private deleteCollectionDialog = false;

    private collectionForm = {
      valid: false,
      data: {
        name: this.collection.name,
        description: this.collection.description,
      },
      rules: {
        name: [(value: string) => !!value || 'Collection name is required', (value: string) => value.length <= 50 || 'Max 50 characters'],
        description: [(value: string) => !!value || 'Collection description is required', (value: string) => value.length <= 500 || 'Max 500 characters'],
      }
    };

    get form(): Vue & { resetValidation: () => void } {
      return this.$refs.form as Vue & { resetValidation: () => void };
    }

    get isFormUntouched(): boolean {
      return this.collectionForm.data.name === this.collection.name && this.collectionForm.data.description === this.collection.description;
    }

    @Watch('tab')
    private onTabChanges(value: string): void {
      if (value === 'configuration') {
        this.form.resetValidation();
        this.collectionForm.data.name = this.collection.name;
        this.collectionForm.data.description = this.collection.description;
      }
    }

    updateCollection(): void {
      collectionService.updateCollection(this.collection.id, this.collectionForm.data).then(
          response => {
            this.collection.name = response.body.name;
            this.collection.description = response.body.description;
          }, error => {
            console.error(error);
          }
      )
    }

    deleteCollection(): void {
      collectionService.deleteCollection(this.collection.id).then(
          response => {
            this.$router.push({name: 'collection-list'});
          }, error => {
            console.error(error);
          }
      )
    }
  }
</script>

<style scoped lang="scss">

</style>
