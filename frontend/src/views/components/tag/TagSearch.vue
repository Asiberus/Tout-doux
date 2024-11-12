<script setup lang="ts">
import { Tag, TagType } from '@/models/tag.model'
import { tagApi } from '@/api'
import TagChip from '@/views/components/tag/TagChip.vue'
import { ref, watch } from 'vue'

const selectedTags = defineModel<Tag[]>()

const props = defineProps<{
  type: TagType
  disabled?: boolean
}>()

const tagList = ref<Tag[]>([])
const search = ref<string | null>(null)
const isLoading = ref(false)
let searchTimer: number | undefined = undefined

watch(search, (value: string) => {
  clearTimeout(searchTimer)

  if (!value) {
    cleanTagList()
    return
  }

  isLoading.value = true
  searchTimer = setTimeout(() => searchTags(value), 200)
})

function searchTags(value: string): void {
  const excludedId = selectedTags.value.map(({ id }) => id).join(',')
  tagApi
    .getTagList({
      type: props.type,
      search: value,
      size: 0,
      exclude_ids: excludedId || undefined,
    })
    .then(response => (tagList.value = response.content))
    .catch(error => console.error(error))
    .finally(() => (isLoading.value = false))
}

function updateSelectedTags(tags: Tag[]): void {
  selectedTags.value = [...tags]
  cleanTagList()
}

function cleanTagList(): void {
  tagList.value = []
  search.value = null
  isLoading.value = false
}
</script>

<template>
  <div>
    <v-autocomplete
      v-model:search-input="search"
      :model-value="selectedTags"
      :disabled
      :items="tagList"
      :loading="isLoading"
      :menu-props="{ contentClass: 'background-elevation' }"
      multiple
      return-object
      no-filter
      hide-no-data
      hide-details
      density="compact"
      auto-select-first
      placeholder="Search tags"
      @update:model-value="updateSelectedTags($event)">
      <template #item="{ item }">
        <TagChip :tag="item" />
      </template>
      <template #selection="{ item }">
        <!-- Empty to remove search when a tag is selected -->
      </template>
    </v-autocomplete>
  </div>
</template>
