<script setup lang="ts">
import { Task, TaskPatch, TaskPost } from '@/models/task.model'
import { Form } from '@/models/common.model'
import { Tag } from '@/models/tag.model'
import TagSearch from '@/views/components/tag/TagSearch.vue'
import TagChip from '@/views/components/tag/TagChip.vue'
import { onBeforeMount, ref, useTemplateRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    isDialogOpen: boolean
    task?: Task
    itemName?: string
  }>(),
  { itemName: 'task', task: undefined }
)

const emit = defineEmits<{
  update: [data: TaskPatch]
  create: [data: TaskPatch]
  submit: [data: TaskPatch]
  close: []
}>()

const formRef = useTemplateRef('form')
const inputNameRef = useTemplateRef('name')

onBeforeMount(() => {
  if (props.task) populateForm(props.task)
})

const tagList = ref<Tag[]>([])
const taskForm = ref<Form<TaskPost | TaskPatch>>({
  valid: false,
  data: {
    name: '',
    tagIds: [],
  },
  rules: {
    name: [
      (value: string): boolean | string => !!value || 'Task name is required',
      (value: string): boolean | string => value.length <= 50 || 'Max 50 characters',
    ],
  },
})

watch(
  () => props.isDialogOpen,
  (value: boolean) => {
    if (value) {
      populateForm(props.task)
      formRef.value.resetValidation()
      if (!props.task) inputNameRef.value.focus()
    }
  }
)

watch(tagList, (value: Tag[]) => {
  taskForm.value.data.tagIds = value.map(({ id }) => id)
})

function populateForm(task?: Task): void {
  if (task) {
    taskForm.value.data.name = task.name
    taskForm.value.data.tagIds = task.tags.map(({ id }) => id)
    tagList.value = [...task.tags]
  } else {
    taskForm.value.data.name = ''
    taskForm.value.data.tagIds = []
    tagList.value = []
  }
}

function removeTag(id: number): void {
  tagList.value = tagList.value.filter(tag => tag.id !== id)
}

function emitSubmitEvent(): void {
  if (!taskForm.value.valid) return

  if (props.task) emit('update', taskForm.value.data)
  else emit('create', taskForm.value.data)
  // Todo : to delete
  emit('submit', taskForm.value.data)
}

function emitCloseEvent(): void {
  emit('close')
}
</script>

<template>
  <v-card class="d-flex flex-column">
    <div class="px-6 pt-4 pb-2">
      <h4 class="text-h5 text-sm-h4">{{ task ? 'Update' : 'New' }} {{ itemName }}</h4>
    </div>
    <v-card-text class="flex-grow-1 d-flex flex-column">
      <v-form
        ref="form"
        v-model="taskForm.valid"
        class="flex-grow-1 d-flex flex-column"
        @submit.prevent="emitSubmitEvent()">
        <v-text-field
          ref="name"
          v-model="taskForm.data.name"
          label="Name"
          counter="50"
          requried
          :rules="taskForm.rules.name"
          :autofocus="!task"
          class="flex-grow-0 mb-2" />

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
            @clear="removeTag($event)" />
        </div>

        <v-spacer />

        <div class="d-flex justify-end gap-2">
          <v-btn variant="plain" class="flex-grow-1 flex-md-grow-0" @click="emitCloseEvent()">
            cancel
          </v-btn>
          <v-btn
            color="success"
            variant="text"
            type="submit"
            :disabled="!taskForm.valid"
            class="flex-grow-1 flex-md-grow-0">
            {{ task ? 'update' : 'create' }}
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.tag-wrapper {
  min-height: 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
