<script setup lang="ts">
import { Tag, TagType } from '@/models/tag.model'
import { tagApi } from '@/api'
import TagChip from '@/views/components/tag/TagChip.vue'
import { onMounted, ref } from 'vue'

const selectedTags = defineModel<Tag[]>({ required: true })

const props = defineProps<{
  type: TagType
  disabled?: boolean
}>()

const tagList = ref<Tag[]>([])
const search = ref<string>()
const menu = ref(false)
const isLoading = ref(false)

onMounted(() => {
  isLoading.value = true
  tagApi
    .getTagList({ type: props.type, sort: 'name', size: 200 })
    .then(response => (tagList.value = response.content))
    .catch(error => console.error(error))
    .finally(() => (isLoading.value = false))
})

function updateSelectedTags(tags: Tag[]): void {
  selectedTags.value = [...tags]
  menu.value = false
}

// Entrée seule reste au composant : Vuetify ouvre le menu. Cmd/Ctrl+Entrée valide le formulaire
// porteur — et doit être interceptée en capture, car le `onKeydown` de Vuetify ne regarde aucun
// modificateur et sélectionnerait le premier item au passage.
function submitParentForm(event: KeyboardEvent): void {
  if (!event.metaKey && !event.ctrlKey) return

  event.preventDefault()
  event.stopPropagation()
  ;(event.target as HTMLElement).closest('form')?.requestSubmit()
}
</script>

<template>
  <div @keydown.enter.capture="submitParentForm($event)">
    <v-autocomplete
      v-model:search="search"
      v-model:menu="menu"
      :model-value="selectedTags"
      :disabled
      :items="tagList"
      item-title="name"
      item-value="id"
      :loading="isLoading"
      :menu-props="{ contentClass: 'background-elevation' }"
      multiple
      return-object
      hide-selected
      clear-on-select
      hide-no-data
      hide-details
      density="compact"
      auto-select-first
      placeholder="Search tags"
      @update:model-value="updateSelectedTags($event)">
      <template #item="{ props: itemProps, item }">
        <v-list-item v-bind="itemProps" :title="undefined">
          <TagChip :tag="item" />
        </v-list-item>
      </template>
      <template #selection>
        <!-- Empty to remove search when a tag is selected -->
      </template>
    </v-autocomplete>

    <div v-if="!isLoading && !tagList.length" class="mt-1">
      <router-link
        :to="{ name: 'settings-tags', query: { type } }"
        class="text-link text-body-medium text-green-lighten-1">
        You currently have no {{ type }} tags. Click here to create your first tag !
      </router-link>
    </div>
  </div>
</template>
