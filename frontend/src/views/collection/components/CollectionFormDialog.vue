<template>
  <v-card>
    <v-card-title>New collection</v-card-title>
    <v-card-text>
      <v-form ref="form" v-model="collectionForm.valid" @submit.prevent="emitSubmitEvent">
        <v-row>
          <v-col>
            <v-text-field v-model="collectionForm.data.name" label="Name" counter="50" maxlength="50" required
                          :rules="collectionForm.rules.name" autofocus>
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
import {Component, Vue} from "vue-property-decorator";

@Component
export default class CollectionFormDialog extends Vue {
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
  };

  private emitSubmitEvent(): void {
    if (!this.collectionForm.valid) return;

    this.$emit('submit', this.collectionForm.data);
  }

  private emitCloseEvent(): void {
    this.$emit('close');
  }
}
</script>

<style scoped lang="scss">

</style>
