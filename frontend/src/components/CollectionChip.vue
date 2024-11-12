<script setup lang="ts">
import { Collection } from '@/models/collection.model'
import { RouteLocation } from 'vue-router'
import { computed } from 'vue'

const {
  collection,
  ripple = false,
  small = false,
  navigateToDetail = true,
} = defineProps<{
  collection: Collection
  ripple?: boolean
  small?: boolean
  navigateToDetail?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const title = computed<string>(() => {
  let str = `Go to : ${collection.name}`
  if (collection.archived) str += ' (Archived)'
  return str
})

const detailLocation = computed<RouteLocation | null>(() => {
  if (!navigateToDetail) return null
  return { name: 'collection-detail', params: { id: `${collection.id}` } }
})

function click(): void {
  if (collection.archived) return

  emit('click')
}
</script>

<template>
  <v-chip
    :to="detailLocation"
    label
    :color="collection.archived ? 'projectArchived' : 'collection'"
    :ripple
    :size="small ? 'small' : 'default'"
    :title
    class="collection-chip px-0"
    :class="{ 'cursor-default': collection.archived && !detailLocation }"
    @click="click()">
    <v-icon size="small" class="ml-2 mr-1">mdi-list-box</v-icon>
    <div class="text-truncate mr-2">
      {{ collection.name }}
    </div>
  </v-chip>
</template>

<style scoped lang="scss">
.collection-chip {
  min-width: 32px;
}
</style>
