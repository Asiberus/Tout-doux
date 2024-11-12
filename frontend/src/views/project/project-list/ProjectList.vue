<script setup lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import { ProjectList, ProjectPostOrPatch } from '@/models/project.model'
import ProjectFormDialog from '@/views/project/components/ProjectFormDialog.vue'
import ProjectCard from '@/views/project/components/ProjectCard.vue'
import MainTitle from '@/components/MainTitle.vue'
import { getDialogWidth } from '@/utils/dialog.utils'
import { onBeforeMount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { projectApi } from '@/api'

const router = useRouter()
const display = useDisplay()

const props = defineProps<{
  archived: boolean // TODO : test undefiness
}>()

const projectList = ref<ProjectList[]>([])
const projectDialog = ref(false)

onBeforeMount(() => {
  retrieveProjectList({ archived: props.archived })
})

watch(
  () => props.archived,
  (value: boolean) => {
    retrieveProjectList({ archived: value })
  }
)

function retrieveProjectList(params = {}): void {
  projectApi.getProjectList(params).then(
    response => (projectList.value = response.content),
    error => console.error(error)
  )
}

function createProject(projectForm: ProjectPostOrPatch): void {
  projectDialog.value = false
  projectApi.createProject(projectForm).then(
    response => router.push({ name: 'project-detail', params: { id: response.id } }),
    error => console.error(error)
  )
}

function toggleArchivedProject(): void {
  router.replace({ query: { archived: (!props.archived).toString() } })
}
</script>

<template>
  <div class="d-flex flex-column h-100">
    <div class="d-flex flex-column flex-sm-row align-center gap-2 mb-3 mb-md-6">
      <MainTitle icon="mdi-briefcase-variant" class="flex-grow-1">Projects</MainTitle>

      <div class="d-flex align-center gap-2">
        <FilterChip
          :value="archived"
          color="accent"
          icon="mdi-archive"
          @input="toggleArchivedProject()">
          Archived
        </FilterChip>

        <v-dialog v-model="projectDialog" :width="getDialogWidth()" :fullscreen="display.smAndDown">
          <template #activator="{ props: menuProps }">
            <v-btn v-bind="menuProps">
              <v-icon start>mdi-plus</v-icon>
              project
            </v-btn>
          </template>
          <ProjectFormDialog
            :is-dialog-open="projectDialog"
            @submit="createProject($event)"
            @close="projectDialog = false" />
        </v-dialog>
      </div>
    </div>

    <template v-if="projectList.length > 0">
      <div class="project-wrapper">
        <ProjectCard v-for="project in projectList" :key="project.id" :project />
      </div>
    </template>
    <template v-else>
      <EmptyListDisplay class="empty-list-display">
        <template #img>
          <img
            v-if="!archived"
            src="../../../assets/project-empty.svg"
            alt="No project"
            class="empty-list-display__img" />
          <img
            v-else
            src="../../../assets/project-archived-empty.svg"
            alt="No archived project"
            class="empty-list-display__img" />
        </template>
        <template #message>
          <div v-if="!archived" class="d-flex flex-column align-center gap-2">
            <span>You don't have any project yet!</span>
            <v-btn @click="projectDialog = true">
              <v-icon start>mdi-plus</v-icon>
              project
            </v-btn>
          </div>
          <div v-else>You don't have any archived project.</div>
        </template>
      </EmptyListDisplay>
    </template>
  </div>
</template>

<style scoped lang="scss">
@import 'vuetify/settings';

.project-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(max(288px, calc((100% - 2 * 12px) / 3)), 1fr));
  gap: 12px;

  @media #{map-get($display-breakpoints, 'md-and-up')} {
    grid-template-columns: repeat(auto-fill, minmax(max(420px, calc((100% - 2 * 12px) / 3)), 1fr));
  }

  @media #{map-get($display-breakpoints, 'xl')} {
    grid-template-columns: repeat(auto-fill, minmax(max(500px, calc((100% - 2 * 12px) / 3)), 1fr));
  }

  & > * {
    min-width: 0;
  }
}

.empty-list-display {
  flex-grow: 1;

  &__img {
    width: clamp(250px, 50%, 450px);
  }
}
</style>
