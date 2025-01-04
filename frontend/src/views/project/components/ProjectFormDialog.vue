<script setup lang="ts">
import TagSearch from '@/views/components/tag/TagSearch.vue'
import TagChip from '@/views/components/tag/TagChip.vue'
import { Tag } from '@/models/tag.model'
import { Form } from '@/models/common.model'
import { ProjectPostOrPatch } from '@/models/project.model'
import { ref, useTemplateRef, watch } from 'vue'

const props = defineProps<{
  isDialogOpen: boolean
}>()

const emit = defineEmits<{
  submit: [data: ProjectPostOrPatch]
  close: []
}>()

const formRef = useTemplateRef('form')
const inputNameRef = useTemplateRef('name')

const tagList = ref<Tag[]>([])
const projectForm = ref<Form<ProjectPostOrPatch>>({
  valid: false,
  data: {
    name: '',
    description: '',
    tagIds: [],
  },
  rules: {
    name: [
      (value: string): boolean | string => !!value || 'Project name is required',
      (value: string): boolean | string => value.length <= 50 || 'Max 50 characters',
    ],
    description: [
      (value: string): boolean | string => !!value || 'Project description is required',
      (value: string): boolean | string => value.length <= 500 || 'Max 500 characters',
    ],
  },
})

watch(
  () => props.isDialogOpen,
  (value: boolean) => {
    if (!value) return

    projectForm.value.data = { name: '', description: '', tagIds: [] }
    tagList.value = []
    formRef.value.resetValidation()
    inputNameRef.value.focus()
  }
)

watch(tagList, (value: Tag[]) => {
  projectForm.value.data.tagIds = value.map(({ id }) => id)
})

function removeTag(id: number): void {
  tagList.value = tagList.value.filter(tag => tag.id !== id)
}

function emitSubmitEvent(): void {
  if (!projectForm.value.valid) return

  emit('submit', projectForm.value.data)
}

function emitCloseEvent(): void {
  emit('close')
}
</script>

<template>
  <v-card class="d-flex flex-column">
    <div class="px-6 pt-4 pb-2">
      <h4 class="text-h5 text-sm-h4">New project</h4>
    </div>

    <v-card-text class="flex-grow-1 d-flex flex-column">
      <v-form
        ref="form"
        v-model="projectForm.valid"
        class="flex-grow-1 d-flex flex-column"
        @submit.prevent="emitSubmitEvent()">
        <div class="inputs-wrapper">
          <v-text-field
            ref="name"
            v-model="projectForm.data.name"
            :rules="projectForm.rules.name"
            label="Name"
            counter="50"
            required
            autofocus
            class="mb-2" />
          <v-textarea
            v-model="projectForm.data.description"
            :rules="projectForm.rules.description"
            label="Description"
            counter="500"
            required
            rows="1"
            auto-grow
            class="mb-2"
            @keyup.enter.ctrl="emitSubmitEvent()" />

          <h6 class="text-h6 text-grey-lighten-2">
            <v-icon size="small">mdi-tag</v-icon>
            Tags
          </h6>
          <TagSearch v-model="tagList" type="project" class="mb-5" />

          <div class="tag-wrapper mb-3">
            <TagChip
              v-for="tag of tagList"
              :key="tag.id"
              :tag="tag"
              clearable
              @clear="removeTag($event)" />
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
            :disabled="!projectForm.valid"
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

.tag-wrapper {
  min-height: 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
