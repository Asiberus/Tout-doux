<script setup lang="ts">
import { ProjectList } from '@/models/project.model'
import TagGroup from '@/views/components/tag/TagGroup.vue'
import TaskCounter from '@/components/TaskCounter.vue'
import { computed } from 'vue'

const props = defineProps<{
  project: ProjectList
}>()

const percentageOfCompletedTask = computed<number>(
  () => (props.project.completedTaskCount / props.project.taskCount) * 100
)
</script>

<template>
  <v-card
    :to="{ name: 'project-detail', params: { id: project.id } }"
    :color="project.archived ? 'projectArchivedCard' : null"
    :ripple="false"
    class="project-card rounded-lg">
    <v-progress-linear :model-value="percentageOfCompletedTask" color="green-accent-2" height="6" />
    <v-card-text class="d-flex justify-space-between align-center gap-1 pa-3 pa-sm-4">
      <div class="flex-shrink-1 overflow-hidden">
        <h5
          class="text-h6 text-sm-h5 text-white font-weight-bold text-truncate"
          :title="project.name">
          {{ project.name }}
        </h5>
        <p
          class="text-subtitle-2 text-sm-subtitle-1 text-truncate mb-0"
          :title="project.description">
          {{ project.description }}
        </p>

        <TagGroup v-if="project.tags.length > 0" :tag-list="project.tags" class="mt-1" />
      </div>

      <div class="d-flex flex-column gap-2 align-end">
        <TaskCounter
          v-if="project.taskCount > 0"
          :value="project.completedTaskCount"
          :max="project.taskCount" />
        <div v-if="project.eventsToCome > 0" class="d-flex gap-1">
          <span class="event-count">{{ project.eventsToCome }}</span>
          <v-icon>mdi-calendar-clock</v-icon>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.project-card {
  min-height: 122px;
  display: grid;
  grid-template-rows: auto 1fr;

  & > * {
    min-width: 0;
  }

  .event-count {
    font-size: 1.5rem;
    color: white;

    @media #{map.get(variables.$display-breakpoints, 'sm-and-down')} {
      font-size: 1.25rem;
    }
  }
}
</style>
