<script setup lang="ts">
import { RouteLocationRaw } from 'vue-router'
import { computed } from 'vue'
import { Project } from '@/models/project.model'

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

const title = computed<string>(() => {
  let str = `Go to : ${project.name}`
  if (project.archived) str += ' (Archived)'
  return str
})

const detailLocation = computed<RouteLocationRaw | undefined>(() => {
  if (!navigateToDetail) return undefined
  return { name: 'project-detail', params: { id: `${project.id}` } }
})

function click(): void {
  if (project.archived) return

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
    :title
    variant="flat"
    class="project-chip px-0"
    :class="{ 'cursor-default': project.archived && !detailLocation }"
    @click.stop="click()">
    <v-icon icon="mdi-briefcase-variant" size="small" class="ml-2 mr-1" />
    <div class="text-truncate mr-2">
      {{ project.name }}
    </div>
  </v-chip>
</template>

<style scoped lang="scss">
.project-chip {
  min-width: 32px;
}
</style>
