<script setup lang="ts">
import { Form } from '@/models/common.model'
import { CollectionPost } from '@/models/collection.model'
import { ref, useTemplateRef, watch } from 'vue'

const { isDialogOpen } = defineProps<{
  isDialogOpen: boolean
}>()

const emit = defineEmits<{
  submit: [data: CollectionPost]
  close: []
}>()

const formRef = useTemplateRef('form')
const inputNameRef = useTemplateRef('name')

const collectionForm = ref<Form<CollectionPost>>({
  valid: false,
  data: {
    name: '',
    description: '',
    itemName: 'task',
  },
  rules: {
    name: [
      (value: string): boolean | string => !!value || 'Collection name is required',
      (value: string): boolean | string => value.length <= 50 || 'Max 50 characters',
    ],
    description: [
      (value: string): boolean | string => !!value || 'Collection description is required',
      (value: string): boolean | string => value.length <= 500 || 'Max 500 characters',
    ],
    itemName: [
      (value: string): boolean | string => !!value || 'This field is required',
      (value: string): boolean | string => value.length <= 15 || 'Max 15 characters',
    ],
  },
})

watch(
  () => isDialogOpen,
  (value: boolean) => {
    if (!value) return

    formRef.value.resetValidation()
    inputNameRef.value.focus()
    collectionForm.value.data = { name: '', description: '', itemName: 'task' }
  }
)

function emitSubmitEvent(): void {
  if (!collectionForm.value.valid) return

  emit('submit', collectionForm.value.data)
}

function emitCloseEvent(): void {
  emit('close')
}
</script>

<template>
  <v-card class="d-flex flex-column">
    <div class="px-6 pt-4 pb-2">
      <h4 class="text-h5 text-sm-h4">New collection</h4>
    </div>
    <v-card-text class="flex-grow-1 d-flex flex-column">
      <v-form
        ref="form"
        v-model="collectionForm.valid"
        class="flex-grow-1 d-flex flex-column"
        @submit.prevent="emitSubmitEvent()">
        <div class="inputs-wrapper">
          <v-text-field
            ref="name"
            v-model="collectionForm.data.name"
            :rules="collectionForm.rules.name"
            label="Name"
            counter="50"
            required
            autofocus
            class="mb-2">
          </v-text-field>

          <v-textarea
            v-model="collectionForm.data.description"
            :rules="collectionForm.rules.description"
            label="Description"
            counter="500"
            required
            rows="1"
            auto-grow
            class="mb-2"
            @keyup.enter.ctrl="emitSubmitEvent()">
          </v-textarea>

          <div class="item-name-wrapper mb-2">
            <v-text-field
              v-model="collectionForm.data.itemName"
              :rules="collectionForm.rules.itemName"
              label="Item name"
              counter="15"
              required>
            </v-text-field>
          </div>
        </div>

        <div class="d-flex justify-end gap-2">
          <v-btn variant="plain" class="flex-grow-1 flex-md-grow-0" @click="emitCloseEvent()">
            cancel
          </v-btn>
          <v-btn
            color="success"
            variant="text"
            type="submit"
            :disabled="!collectionForm.valid"
            class="flex-grow-1 flex-md-grow-0">
            create
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

@media #{map.get(variables.$display-breakpoints, 'sm-and-down')} {
  .inputs-wrapper {
    flex: 1 0 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
}

@media #{map.get(variables.$display-breakpoints, 'sm')} {
  .item-name-wrapper {
    width: 50%;
  }
}

@media #{map.get(variables.$display-breakpoints, 'md-and-up')} {
  .item-name-wrapper {
    width: calc(100% / 3);
  }
}
</style>
