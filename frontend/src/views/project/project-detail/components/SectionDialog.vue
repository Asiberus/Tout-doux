<script setup lang="ts">
import { SectionTask } from '@/models/section.model'
import { onBeforeMount, ref, useTemplateRef, watch } from 'vue'
import { useDisplay } from 'vuetify'

const display = useDisplay()

const props = defineProps<{
  section?: SectionTask
  isDialogOpen: boolean
}>()

const emit = defineEmits<{
  submit: [data: { name: string }]
  delete: []
  close: []
}>()

const formRef = useTemplateRef('form')
const inputNameRef = useTemplateRef('name')

onBeforeMount(() => {
  if (props.section) populateForm(props.section.name)
})

const confirmDelete = ref(false)
const sectionForm = ref({
  valid: false,
  data: {
    name: '',
  },
  rules: {
    name: [
      (value: string): boolean | string => !!value || 'Section name is required',
      (value: string): boolean | string => value.length <= 50 || 'Max 50 characters',
    ],
  },
})

watch(
  () => props.isDialogOpen,
  (value: boolean) => {
    if (value) {
      confirmDelete.value = false
      formRef.resetValidation()
      if (props.section) populateForm(props.section.name)
      else populateForm('')
      inputNameRef.focus()
    }
  }
)

function populateForm(name: string): void {
  sectionForm.value.data.name = name
}

function emitSubmitEvent(): void {
  if (!sectionForm.value.valid) return

  emit('submit', sectionForm.value.data)
}

function emitDeleteSection(): void {
  if (!confirmDelete.value) {
    confirmDelete.value = true
    return
  }

  emit('delete')
}

function emitCloseEvent(): void {
  emit('close')
}
</script>

<template>
  <v-card class="d-flex flex-column">
    <div class="d-flex justify-end align-center flex-wrap gap-2 px-6 pt-4 pb-2">
      <h4 class="text-h5 text-sm-h4 flex-grow-1">
        {{ section ? 'Update section' : 'New section' }}
      </h4>

      <v-hover v-if="section" v-slot="{ hover }">
        <v-btn
          :color="hover || confirmDelete ? 'error' : null"
          :size="display.xs ? 'small' : 'default'"
          @click="emitDeleteSection()">
          {{ confirmDelete ? 'Are you sure ?' : 'Delete section' }}
        </v-btn>
      </v-hover>
    </div>
    <v-card-text class="flex-grow-1 d-flex flex-column">
      <v-form
        ref="form"
        v-model="sectionForm.valid"
        class="flex-grow-1 d-flex flex-column"
        @submit.prevent="emitSubmitEvent()">
        <v-text-field
          ref="name"
          v-model="sectionForm.data.name"
          label="Name"
          counter="50"
          required
          :rules="sectionForm.rules.name"
          autofocus />

        <v-spacer />

        <div class="d-flex justify-end gap-2">
          <v-btn variant="plain" class="flex-grow-1 flex-md-grow-0" @click="emitCloseEvent()">
            cancel
          </v-btn>
          <v-btn
            color="success"
            variant="text"
            type="submit"
            :disabled="!sectionForm.valid"
            class="flex-grow-1 flex-md-grow-0">
            {{ section ? 'update' : 'create' }}
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>
