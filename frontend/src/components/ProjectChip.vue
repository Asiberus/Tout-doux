<script setup lang="ts">
import { RouteLocation } from 'vue-router'
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

const detailLocation = computed<RouteLocation | null>(() => {
  if (!navigateToDetail) return null
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
    class="project-chip px-0"
    :class="{ 'cursor-default': project.archived && !detailLocation }"
    @click="click()">
    <v-icon size="small" class="ml-2 mr-1">mdi-briefcase-variant</v-icon>
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
