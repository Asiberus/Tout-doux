<script setup lang="ts">
import { Tag } from '@/models/tag.model'
import { Form } from '@/models/common.model'
import { DailyTask, DailyTaskPatch } from '@/models/daily-task.model'
import TagSearch from '@/views/components/tag/TagSearch.vue'
import TagChip from '@/views/components/tag/TagChip.vue'
import DailyTaskActionChip from '@/views/daily/components/DailyTaskActionChip.vue'
import { onBeforeMount, ref, watch } from 'vue'

const props = defineProps<{
  dailyTask?: DailyTask
}>()

const emit = defineEmits<{
  submit: [data: DailyTaskPatch]
  close: []
}>()

const tagList = ref<Tag[]>([])
const dailyTaskForm = ref<Form<DailyTaskPatch>>({
  valid: false,
  data: {
    action: null,
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

onBeforeMount(() => {
  if (props.dailyTask) {
    dailyTaskForm.value.data = {
      action: props.dailyTask.action,
      name: props.dailyTask.name,
      tagIds: props.dailyTask.tags.map(({ id }) => id),
    }
    tagList.value = props.dailyTask.tags
  }
})

watch(tagList, (value: Tag[]): void => {
  dailyTaskForm.value.data.tagIds = value.map(({ id }) => id)
})

function submit(): void {
  emit('submit', dailyTaskForm.value.data)
}

function close(): void {
  emit('close')
}

function removeTag(id: number): void {
  tagList.value = tagList.value.filter(tag => tag.id !== id)
}
</script>

<template>
  <v-form v-model="dailyTaskForm.valid" @submit.prevent="submit()">
    <div class="d-flex align-center gap-2">
      <DailyTaskActionChip
        v-model:action="dailyTaskForm.data.action"
        :editable="true"
        class="mb-4" />

      <v-text-field
        v-model="dailyTaskForm.data.name"
        :rules="dailyTaskForm.rules.name"
        label="Name"
        counter="50"
        required
        autofocus
        class="mb-2" />
    </div>

    <TagSearch v-model="tagList" type="task" class="mb-5" />
    <div class="tag-wrapper mb-2">
      <TagChip v-for="tag of tagList" :key="tag.id" :tag clearable @clear="removeTag($event)" />
    </div>

    <v-card-actions class="justify-end">
      <v-btn variant="plain" size="small" @click="close()">cancel</v-btn>
      <v-btn
        color="success"
        variant="text"
        size="small"
        :disabled="!dailyTaskForm.valid"
        type="submit">
        {{ dailyTask ? 'update' : 'create' }}
      </v-btn>
    </v-card-actions>
  </v-form>
</template>

<style scoped lang="scss">
@import 'vuetify/settings';

.tag-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  @media #{map-get($display-breakpoints, 'sm-and-down')} {
    gap: 4px;
  }
}
</style>
