<script setup lang="ts">
import SecondaryTitle from '@/components/SecondaryTitle.vue'
import { useDisplay } from 'vuetify'
import { useProjectStore } from '@/store'
import { onBeforeMount, onUnmounted } from 'vue'

const display = useDisplay()
const projectStore = useProjectStore()

const props = defineProps<{
  projectId: number
}>()

onBeforeMount(() => {
  projectStore.retrieveProject(props.projectId)
})

onUnmounted(() => {
  projectStore.removeCurrentProject()
})
</script>

<template>
  <div v-if="projectStore.currentProject" class="d-flex flex-column h-100">
    <div class="d-flex flex-column flex-sm-row align-center column-gap-2 row-gap-1">
      <v-icon v-if="display.xs">mdi-briefcase-variant</v-icon>

      <SecondaryTitle class="text-center text-sm-start">
        <span v-if="display.smAndUp" class="text-grey">Project : </span>
        {{ projectStore.currentProject.name }}
      </SecondaryTitle>

      <v-chip v-if="projectStore.currentProject.archived" color="accent" class="flex-shrink-0">
        <v-icon size="small" class="mr-1"> mdi-archive </v-icon>
        Archived
      </v-chip>
    </div>

    <v-divider class="my-2 my-sm-4" />

    <v-tabs bg-color="transparent" color="accent" class="flex-grow-0 mb-3" show-arrows>
      <v-tab :to="{ name: 'project-detail' }" exact>Description</v-tab>
      <v-tab :to="{ name: 'project-detail-section' }">Section</v-tab>
      <v-tab :to="{ name: 'project-detail-event' }">Event</v-tab>
      <v-tab disabled>Historic</v-tab>
      <v-tab :to="{ name: 'project-detail-settings' }">Settings</v-tab>
    </v-tabs>

    <router-view />
  </div>
</template>

<style scoped lang="scss">
@import 'vuetify/settings';

.v-tabs :deep(.v-slide-group__prev, .v-slide-group__next) {
  min-width: initial;
  flex-basis: auto;
}

@media #{map-get($display-breakpoints, 'xs')} {
  .v-tabs :deep(.v-tab) {
    font-size: 0.7rem;
    padding: 0 8px;
  }
}
</style>
