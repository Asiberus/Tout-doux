<script setup lang="ts">
import { Collection } from '@/models/collection.model'
import { RouteLocationRaw } from 'vue-router'
import { computed } from 'vue'
import TruncatedText from '@/components/TruncatedText.vue'

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

const detailLocation = computed<RouteLocationRaw | undefined>(() => {
  if (!navigateToDetail) return undefined
  return { name: 'collection-detail', params: { id: `${collection.id}` } }
})

function click(): void {
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
    variant="flat"
    class="collection-chip px-0"
    @click.stop="click()">
    <v-icon icon="mdi-list-box" size="small" class="ml-2 mr-1" />
    <TruncatedText :text="collection.name" class="mr-2" />
  </v-chip>
</template>

<style scoped lang="scss">
.collection-chip {
  min-width: 32px;

  :deep(.v-chip__content) {
    min-width: 0;
    max-width: 300px;
  }
}
</style>
