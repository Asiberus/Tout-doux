<script setup lang="ts">
import { CollectionDetail, CollectionPatch } from '@/models/collection.model'
import { Form } from '@/models/common.model'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { computed, ref, useTemplateRef } from 'vue'
import { useCollectionStore } from '@/store'
import { collectionApi } from '@/api'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

const router = useRouter()
const display = useDisplay()
const collectionStore = useCollectionStore()

const formRef = useTemplateRef('form')

const collectionForm = ref<Form<CollectionPatch>>({
  valid: false,
  data: {
    name: collectionStore.currentCollection.name,
    description: collectionStore.currentCollection.description,
    itemName: collectionStore.currentCollection.itemName,
  },
  rules: {
    name: [
      (value: string): boolean | string => !!value || 'This field is required',
      (value: string): boolean | string => value.length <= 50 || 'Max 50 characters',
    ],
    description: [
      (value: string): boolean | string => !!value || 'This field is required',
      (value: string): boolean | string => value.length <= 500 || 'Max 500 characters',
    ],
    itemName: [
      (value: string): boolean | string => !!value || 'This field is required',
      (value: string): boolean | string => value.length <= 15 || 'Max 15 characters',
    ],
  },
})

const collection = computed<CollectionDetail>(() => collectionStore.currentCollection)
const isFormUntouched = computed<boolean>(
  () =>
    collectionForm.value.data.name === collection.value.name &&
    collectionForm.value.data.description === collection.value.description &&
    collectionForm.value.data.itemName === collection.value.itemName
)

function toggleCollectionArchiveState(): void {
  collectionStore.updateProperties({ archived: !collection.value.archived })
  resetForm()
}

function resetForm(): void {
  collectionForm.value.data = {
    name: collection.value.name,
    description: collection.value.description,
    itemName: collection.value.itemName,
  }
  formRef.value.resetValidation()
}

function updateCollection(): void {
  collectionStore.updateProperties(collectionForm.value.data)
}

function deleteCollection(): void {
  collectionApi
    .deleteCollection(collection.value.id)
    .then(() => router.push({ name: 'collection-list' }))
    .catch(error => console.error(error))
}
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-sm-row align-stretch column-gap-2 row-gap-1 mb-3">
      <h4 class="text-h6 text-sm-h5 flex-grow-1">Settings</h4>

      <div class="d-flex gap-2">
        <ConfirmDialog @confirm="toggleCollectionArchiveState()">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              :variant="!collection.archived ? 'outlined' : 'elevated'"
              :size="display.xs ? 'small' : 'default'"
              color="accent"
              class="flex-grow-1 flex-sm-grow-0">
              <v-icon size="small" start>mdi-archive</v-icon>
              {{ collection.archived ? 'unarchive' : 'archive' }}
            </v-btn>
          </template>
          <template #icon>
            <v-icon size="x-large">mdi-archive</v-icon>
          </template>
          <span>
            Are you sure to
            {{ collection.archived ? 'unarchive' : 'archive' }} this collection ?
          </span>
        </ConfirmDialog>
        <template v-if="collection.archived">
          <ConfirmDialog @confirm="deleteCollection()">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                variant="outlined"
                color="error"
                :size="display.xs ? 'small' : 'default'"
                class="flex-grow-1 flex-sm-grow-0">
                <v-icon size="small" start>mdi-trash-can</v-icon>
                delete
              </v-btn>
            </template>
            <template #icon>
              <v-icon size="x-large">mdi-trash-can</v-icon>
            </template>
            <p class="mb-1">Are you sure to delete this collection ?</p>
            <p class="mb-0 font-italic" style="font-size: 1.1rem">
              All related {{ collection.itemName }} will be deleted
            </p>
          </ConfirmDialog>
        </template>
      </div>
    </div>

    <v-form
      ref="form"
      v-model="collectionForm.valid"
      class="form-wrapper"
      @submit.prevent="updateCollection()">
      <v-text-field
        v-model="collectionForm.data.name"
        :rules="collectionForm.rules.name"
        :disabled="collection.archived"
        label="Name"
        counter="50"
        required
        class="mb-2">
      </v-text-field>

      <v-textarea
        v-model="collectionForm.data.description"
        :rules="collectionForm.rules.description"
        :disabled="collection.archived"
        label="Description"
        counter="500"
        required
        rows="2"
        auto-grow
        class="mb-2"
        @keyup.enter.ctrl="updateCollection()">
      </v-textarea>

      <div class="item-name-wrapper mb-2">
        <v-text-field
          v-model="collectionForm.data.itemName"
          :rules="collectionForm.rules.itemName"
          :disabled="collection.archived"
          label="Item name"
          counter="15"
          required>
        </v-text-field>
      </div>

      <div v-if="!collection.archived" class="d-flex justify-end mb-5">
        <v-btn
          color="success"
          type="submit"
          :block="display.xs"
          :disabled="!collectionForm.valid || isFormUntouched">
          update
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

@media #{map.get(variables.$display-breakpoints, 'sm')} {
  .item-name-wrapper {
    width: 50%;
  }
}

@media #{map.get(variables.$display-breakpoints, 'md-and-up')} {
  .form-wrapper {
    width: 75%;
  }

  .item-name-wrapper {
    width: calc(100% / 3);
  }
}
</style>
