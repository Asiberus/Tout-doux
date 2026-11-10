<script setup lang="ts">
import { Section } from '@/models/section.model'
import { RouteLocationRaw } from 'vue-router'
import { computed } from 'vue'
import TruncatedText from '@/components/TruncatedText.vue'

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

const detailLocation = computed<RouteLocationRaw | undefined>(() => {
  if (!navigateToDetail) return undefined
  return {
    name: 'project-detail-section',
    params: { id: `${section.project.id}`, sectionId: `${section.id}` },
  }
})

function click(): void {
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
    variant="flat"
    class="section-chip px-0"
    @click.stop="click()">
    <v-icon icon="mdi-briefcase-variant" size="small" class="ml-2 mr-1" />
    <div class="name-wrapper">
      <TruncatedText :text="section.project.name" class="project-name" />
      <span class="separator mx-1">•</span>
      <TruncatedText :text="section.name" class="section-name" />
    </div>
  </v-chip>
</template>

<style scoped lang="scss">
.section-chip {
  min-width: 32px;

  :deep(.v-chip__content) {
    min-width: 0;
    max-width: 300px;
  }

  .name-wrapper {
    display: flex;
    overflow: hidden;
    margin-right: 8px;

    .project-name,
    .section-name {
      flex: 1 1 0;
      min-width: 6ch;
      max-width: max-content;
    }

    .project-name {
      opacity: 0.8;
    }

    .separator {
      flex-shrink: 0;
      opacity: 0.6;
    }
  }
}
</style>
