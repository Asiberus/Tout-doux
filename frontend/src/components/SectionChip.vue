<script setup lang="ts">
import { Section } from 'src/models/section.model'
import { RouteLocation } from 'vue-router'
import { computed } from 'vue'

const {
  section,
  ripple = false,
  small = false,
  navigateToDetail = true,
} = defineProps<{
  section: Section
  ripple?: boolean
  small?: boolean
  navigateToDetail?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const title = computed<string>(() => {
  let str = `Go to : ${section.project.name} • ${section.name}`
  if (section.project.archived) str += ' (Archived)'
  return str
})

const detailLocation = computed<RouteLocation | null>(() => {
  if (!navigateToDetail) return null
  return {
    name: 'project-detail-section',
    params: { id: `${section.project.id}`, sectionId: `${section.id}` },
  }
})

function click(): void {
  if (section.project.archived) return
  emit('click')
}
</script>

<template>
  <v-chip
    :to="detailLocation"
    label
    :color="section.project.archived ? 'projectArchived' : 'project'"
    :ripple
    :size="small ? 'small' : 'default'"
    :title
    :class="{ 'cursor-default': section.project.archived && !detailLocation }"
    class="section-chip px-0"
    @click="click($event)">
    <v-icon size="small" class="ml-2 mr-1">mdi-briefcase-variant</v-icon>
    <div class="name-wrapper">
      <span class="project-name text-truncate">{{ section.project.name }}</span>
      <span class="mx-1">•</span>
      <span class="section-name text-truncate">{{ section.name }}</span>
    </div>
  </v-chip>
</template>

<style scoped lang="scss">
.section-chip {
  min-width: 32px;

  .name-wrapper {
    display: flex;
    overflow: hidden;
    margin-right: 8px;

    .project-name,
    .section-name {
      flex: 1 1 auto;
      min-width: 1ch;
    }
  }
}
</style>
