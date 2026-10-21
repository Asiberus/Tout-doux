<script setup lang="ts">
import { RouteLocationRaw } from 'vue-router'
import { computed } from 'vue'
import { Project } from '@/models/project.model'
import TruncatedText from '@/components/TruncatedText.vue'

const {
  project,
  ripple = false,
  small = false,
  navigateToDetail = true,
} = defineProps<{
  project: Project
  ripple?: boolean
  small?: boolean
  navigateToDetail?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const detailLocation = computed<RouteLocationRaw | undefined>(() => {
  if (!navigateToDetail) return undefined
  return { name: 'project-detail', params: { id: `${project.id}` } }
})

function click(): void {
  emit('click')
}
</script>

<template>
  <v-chip
    :to="detailLocation"
    label
    :color="project.archived ? 'projectArchived' : 'project'"
    :ripple
    :size="small ? 'small' : 'default'"
    variant="flat"
    class="project-chip px-0"
    @click.stop="click()">
    <v-icon icon="mdi-briefcase-variant" size="small" class="ml-2 mr-1" />
    <TruncatedText :text="project.name" class="mr-2" />
  </v-chip>
</template>

<style scoped lang="scss">
.project-chip {
  min-width: 32px;

  :deep(.v-chip__content) {
    min-width: 0;
    max-width: 300px;
  }
}
</style>
