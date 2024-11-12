<script setup lang="ts">
import { CommonTask, CommonTaskForm } from '@/models/common-task.model'
import { Form } from '@/models/common.model'
import { commonTaskApi } from '@/api'
import { IsCommonTaskNameUniqueParams } from '@/api/common-task.api'
import TagSearch from '@/views/components/tag/TagSearch.vue'
import { Tag } from '@/models/tag.model'
import TagChip from '@/views/components/tag/TagChip.vue'
import { getDialogWidth } from '@/utils/dialog.utils'
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { useDisplay } from 'vuetify'

const display = useDisplay()

const show = defineModel<boolean>()

const { commonTask } = defineProps<{
  commonTask?: CommonTask
}>()

const emit = defineEmits<{
  create: [date: CommonTaskForm]
  update: [event: { id: number; data: CommonTaskForm }]
}>()

const formRef = useTemplateRef('form')
const inputNameRef = useTemplateRef('name')

const nameUniqueError = ref<string | null>(null)
const inputNameLoading = ref(false)
let validationTimer: number | undefined = undefined

const tagList = ref<Tag[]>([])
const commonTaskForm = ref<Form<CommonTaskForm>>({
  valid: false,
  pending: false,
  data: {
    name: '',
    tagIds: [],
  },
  rules: {
    name: [
      (value: string): boolean | string => !!value || 'Name is required',
      (value: string): boolean | string => value.length <= 50 || 'Max 50 characters',
    ],
  },
})

watch(show, (value: boolean) => {
  if (value) {
    // We need to wait for next tick to access the form and the input name
    nextTick(() => {
      nameUniqueError.value = null
      formRef.resetValidation()
      populateForm()
      if (!commonTask) inputNameRef.focus()
    })
  }
})

watch(tagList, (value: Tag[]) => {
  commonTaskForm.value.data.tagIds = value.map(({ id }) => id)
})

function populateForm(): void {
  if (commonTask) {
    commonTaskForm.value.data.name = commonTask.name
    commonTaskForm.value.data.tagIds = commonTask.tags.map(({ id }) => id)
    tagList.value = [...commonTask.tags]
  } else {
    commonTaskForm.value.data.name = ''
    commonTaskForm.value.data.tagIds = []
    tagList.value = []
  }
}

function validateName(value: string): void {
  clearTimeout(validationTimer)

  if (value === '') {
    nameUniqueError.value = null
    return
  }

  commonTaskForm.value.pending = true
  validationTimer = setTimeout(() => isNameUnique(value), 300)
}

function isNameUnique(name: string): void {
  const params: IsCommonTaskNameUniqueParams = { name, exclude_id: commonTask?.id }

  inputNameLoading.value = true
  commonTaskApi
    .isNameUnique(params)
    .then(({ unique }) => {
      nameUniqueError.value = !unique ? 'A common task with that name already exist' : null
    })
    .catch(error => console.error(error))
    .finally(() => {
      inputNameLoading.value = false
      commonTaskForm.value.pending = false
    })
}

function removeTag(id: number): void {
  tagList.value = tagList.value.filter(tag => tag.id !== id)
}

function emitSubmit(): void {
  const { data, valid, pending } = commonTaskForm.value
  if (!valid || pending) return

  if (commonTask) emit('update', { id: commonTask.id, data })
  else emit('create', data)
}

function closeDialog(): void {
  show.value = false
}
</script>

<template>
  <v-dialog
    :model-value="show"
    :width="getDialogWidth()"
    :fullscreen="display.smAndDown"
    @update:model-value="show = $event">
    <template #activator="{ props }">
      <slot name="activator" v-bind="props"></slot>
    </template>
    <v-card class="d-flex flex-column">
      <div class="px-6 pt-4 pb-2">
        <h4 class="text-h5 text-sm-h4">
          {{ commonTask ? 'Update Common Task' : 'New Common Task' }}
        </h4>
      </div>
      <v-card-text class="flex-grow-1 d-flex flex-column">
        <v-form
          ref="form"
          v-model="commonTaskForm.valid"
          class="flex-grow-1 d-flex flex-column"
          @submit.prevent="emitSubmit()">
          <v-text-field
            ref="name"
            v-model="commonTaskForm.data.name"
            label="Name"
            counter="50"
            requried
            :loading="inputNameLoading"
            :rules="commonTaskForm.rules.name"
            :error-messages="nameUniqueError"
            :autofocus="!commonTask"
            class="flex-grow-0 mb-2"
            @update:model-value="validateName">
          </v-text-field>

          <h6 class="text-h6 text-grey-lighten-2">
            <v-icon size="small">mdi-tag</v-icon>
            Tags
          </h6>
          <TagSearch v-model="tagList" type="task" class="mb-5" />

          <div class="tag-wrapper mb-3">
            <TagChip
              v-for="tag of tagList"
              :key="tag.id"
              :tag="tag"
              clearable
              @clear="removeTag($event)">
            </TagChip>
          </div>

          <v-spacer></v-spacer>

          <div class="d-flex justify-end gap-2">
            <v-btn variant="plain" class="flex-grow-1 flex-md-grow-0" @click="closeDialog()">
              cancel
            </v-btn>
            <v-btn
              color="success"
              variant="text"
              type="submit"
              :disabled="!commonTaskForm.valid || commonTaskForm.pending"
              class="flex-grow-1 flex-md-grow-0">
              {{ commonTask ? 'update' : 'create' }}
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.tag-wrapper {
  min-height: 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
