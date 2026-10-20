<script setup lang="ts">
import { Task, TaskPatch, TaskPost } from '@/models/task.model'
import { Form } from '@/models/common.model'
import { Tag } from '@/models/tag.model'
import TagSearch from '@/views/components/tag/TagSearch.vue'
import TagChip from '@/views/components/tag/TagChip.vue'
import { useToday } from '@/composables/useToday'
import { dateFormat } from '@/pipes'
import { DueDateShortcut, dueDateShortcuts } from '@/utils/due-date.utils'
import moment from 'moment'
import { computed, onBeforeMount, ref, useTemplateRef, watch } from 'vue'

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
  create: [data: TaskPost]
  submit: [data: TaskPatch]
  close: []
}>()

const { today } = useToday()

const formRef = useTemplateRef('form')
const inputNameRef = useTemplateRef('name')

onBeforeMount(() => {
  if (props.task) populateForm(props.task)
})

const tagList = ref<Tag[]>([])
const dueDatePicker = ref(false)
const taskForm = ref<Form<TaskPost>>({
  valid: false,
  data: {
    name: '',
    tagIds: [],
    dueDate: null,
  },
  rules: {
    name: [
      (value: string): boolean | string => !!value || 'Task name is required',
      (value: string): boolean | string => value.length <= 150 || 'Max 150 characters',
    ],
  },
})

watch(
  () => props.isDialogOpen,
  (value: boolean) => {
    if (value) {
      populateForm(props.task)
      formRef.value?.resetValidation()
      if (!props.task) inputNameRef.value?.focus()
    }
  }
)

const shortcuts = computed<DueDateShortcut[]>(() =>
  dueDateShortcuts(today.value.format('YYYY-MM-DD'))
)

watch(tagList, (value: Tag[]) => {
  taskForm.value.data.tagIds = value.map(({ id }) => id)
})

function populateForm(task?: Task): void {
  if (task) {
    taskForm.value.data.name = task.name
    taskForm.value.data.tagIds = task.tags.map(({ id }) => id)
    taskForm.value.data.dueDate = task.dueDate ?? null
    tagList.value = [...task.tags]
  } else {
    taskForm.value.data.name = ''
    taskForm.value.data.tagIds = []
    taskForm.value.data.dueDate = null
    tagList.value = []
  }
}

function setDueDate(value: string | null): void {
  taskForm.value.data.dueDate = value
  dueDatePicker.value = false
}

function onDueDateSelected(value: unknown): void {
  setDueDate(value ? moment(value as Date).format('YYYY-MM-DD') : null)
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
      <h4 class="text-headline-small text-sm-headline-large">
        {{ task ? 'Update' : 'New' }} {{ itemName }}
      </h4>
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
          counter="150"
          required
          :rules="taskForm.rules?.name"
          :autofocus="!task"
          class="flex-grow-0 mb-2">
          <template #label>Name <span class="text-error">*</span></template>
        </v-text-field>

        <v-menu
          v-model="dueDatePicker"
          :close-on-content-click="false"
          transition="scale-transition"
          min-width="290">
          <template #activator="{ props: menuProps }">
            <v-text-field
              v-bind="menuProps"
              :model-value="
                taskForm.data.dueDate ? dateFormat(taskForm.data.dueDate, 'D MMMM Y') : ''
              "
              label="Due date (optional)"
              prepend-inner-icon="mdi-calendar"
              readonly
              clearable
              persistent-clear
              hide-details
              class="flex-grow-0"
              @click:clear="setDueDate(null)" />
          </template>
          <v-date-picker
            :model-value="
              taskForm.data.dueDate ? moment(taskForm.data.dueDate).toDate() : undefined
            "
            show-adjacent-months
            hide-title
            hide-header
            :first-day-of-week="1"
            @update:model-value="onDueDateSelected" />
        </v-menu>
        <div class="due-date-shortcuts mt-2 mb-5">
          <v-chip
            v-for="shortcut of shortcuts"
            :key="shortcut.label"
            size="small"
            :variant="taskForm.data.dueDate === shortcut.value ? 'flat' : 'tonal'"
            :color="taskForm.data.dueDate === shortcut.value ? 'accent' : undefined"
            @click="setDueDate(shortcut.value)">
            {{ shortcut.label }}
            <span v-if="shortcut.detail" class="due-date-shortcuts__detail">
              · {{ shortcut.detail }}
            </span>
          </v-chip>
        </div>

        <h6 class="text-title-large text-grey-lighten-2 form-section-title">
          <v-icon icon="mdi-tag" size="x-small" />
          Tags
          <span class="form-section-title__optional">optional</span>
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
            :color="taskForm.valid ? 'success' : undefined"
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
.form-section-title {
  display: flex;
  align-items: center;
  gap: 6px;

  &__optional {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }
}

.due-date-shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  &__detail {
    margin-left: 4px;
    opacity: 0.7;
  }
}

.tag-wrapper {
  min-height: 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
