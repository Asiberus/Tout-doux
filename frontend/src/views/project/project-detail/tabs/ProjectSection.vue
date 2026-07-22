<script setup lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { SectionTask } from '@/models/section.model'
import ProjectSectionItem from '@/views/project/project-detail/components/ProjectSectionItem.vue'
import SectionDialog from '@/views/project/project-detail/components/SectionDialog.vue'
import ProgressDisk from '@/components/ProgressDisk.vue'
import { useDialogWidth } from '@/composables/useDialogWidth'
import { computed, ref, watch } from 'vue'
import { useProjectStore } from '@/store'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

const router = useRouter()
const route = useRoute()
const { dialogWidth } = useDialogWidth()
const { smAndDown } = useDisplay()
const projectStore = useProjectStore()

const props = withDefaults(
  defineProps<{
    sectionId?: number
  }>(),
  { sectionId: 0 }
)

const sectionDialog = ref(false)
const sectionTabs = ref<number>(0)

const sections = computed<SectionTask[]>(() => projectStore.currentProject?.sections ?? [])

watch(
  () => props.sectionId,
  (value: number) => {
    sectionTabs.value = sections.value.findIndex(({ id }) => id === value) ?? 0
  },
  { immediate: true }
)

function createSection(data: { name: string }): void {
  if (!projectStore.currentProject) return

  sectionDialog.value = false
  projectStore
    .addSection({ name: data.name, projectId: projectStore.currentProject.id })
    .then(() => (sectionTabs.value = 0))
}

function changeRouteParam(index: number): void {
  router.replace({ params: { ...route.params, sectionId: `${sections.value[index].id}` } })
}
</script>

<template>
  <div class="flex-grow-1 d-flex flex-column">
    <template v-if="sections.length > 0">
      <v-tabs
        v-model="sectionTabs"
        color="accent"
        hide-slider
        show-arrows
        bg-color="transparent"
        class="mb-2 flex-grow-0"
        @update:model-value="changeRouteParam($event)">
        <v-tab v-for="(section, index) of sections" :key="'tab-' + section.id" :value="index">
          <span class="text-truncate">{{ section.name }}</span>

          <ProgressDisk
            v-if="section.tasks.length > 0"
            :value="section.tasks.filter(({ completed }) => completed).length"
            :max="section.tasks.length"
            color="green-accent-2"
            class="ml-1 flex-shrink-0"
            :title="`${section.tasks.filter(({ completed }) => completed).length} of ${
              section.tasks.length
            } tasks completed`">
          </ProgressDisk>
        </v-tab>
      </v-tabs>

      <v-tabs-window v-model="sectionTabs" :touch="false" class="bg-transparent">
        <v-tabs-window-item
          v-for="(section, index) of sections"
          :key="'tab-item-' + section.id"
          :value="index">
          <ProjectSectionItem
            :section
            :disabled="projectStore.currentProject?.archived"
            @new-section="sectionDialog = true">
          </ProjectSectionItem>
        </v-tabs-window-item>
      </v-tabs-window>
    </template>
    <template v-else>
      <EmptyListDisplay class="empty-list-display">
        <template #img>
          <img
            src="../../../../assets/project_section.svg"
            alt="No sections"
            width="200"
            class="empty-list-display__img" />
        </template>
        <template #message>
          <div class="mb-2">This project has no section yet!</div>
          <v-btn
            v-if="!projectStore.currentProject?.archived"
            :size="smAndDown ? 'small' : 'default'"
            @click="sectionDialog = true">
            <v-icon start size="small">mdi-plus</v-icon>
            add a section
          </v-btn>
        </template>
      </EmptyListDisplay>
    </template>

    <v-dialog v-model="sectionDialog" :width="dialogWidth" :fullscreen="smAndDown">
      <SectionDialog
        :is-dialog-open="sectionDialog"
        @submit="createSection($event)"
        @close="sectionDialog = false">
      </SectionDialog>
    </v-dialog>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.v-tab {
  max-width: 300px;
}

.v-tabs :deep(.v-slide-group__prev, .v-slide-group__next) {
  min-width: initial;
  flex: 0 1 auto;
}

@media #{map.get(variables.$display-breakpoints, 'xs')} {
  .v-tab {
    max-width: 150px;
    font-size: 0.7rem;
    padding: 0 8px;
  }
}

.empty-list-display {
  padding-top: 20px;
  flex-grow: 1;

  &__img {
    width: clamp(200px, 50%, 300px);

    @media #{map.get(variables.$display-breakpoints, 'xl')} {
      width: clamp(200px, 50%, 400px);
    }
  }
}
</style>
