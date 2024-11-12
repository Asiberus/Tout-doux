<script setup lang="ts">
import { ProjectDetail, ProjectPostOrPatch } from '@/models/project.model'
import TagSearch from '@/views/components/tag/TagSearch.vue'
import TagChip from '@/views/components/tag/TagChip.vue'
import { Tag } from '@/models/tag.model'
import { Form } from '@/models/common.model'
import deepEqual from 'deep-equal'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useProjectStore } from '@/store'
import { useDisplay } from 'vuetify'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { projectApi } from '@/api'

const router = useRouter()
const display = useDisplay()
const projectStore = useProjectStore()

const formRef = useTemplateRef('form')

const tagList = ref<Tag[]>([])

const projectForm = ref<Form<ProjectPostOrPatch>>({
  valid: false,
  data: {
    name: projectStore.currentProject.name,
    description: projectStore.currentProject.description, // TODO : test it
    tagIds: [],
  },
  rules: {
    name: [
      (value: string): boolean | string => !!value || 'Project name is required',
      (value: string): boolean | string => value.length <= 50 || 'Max 50 characters',
    ],
    description: [
      (value: string): boolean | string => !!value || 'Project description is required',
      (value: string): boolean | string => value.length <= 500 || 'Max 500 characters',
    ],
  },
})

const project = computed<ProjectDetail>(() => projectStore.currentProject)
const isFormUntouched = computed<boolean>(
  () =>
    projectForm.value.data.name === project.value.name &&
    projectForm.value.data.description === project.value.description &&
    deepEqual(
      projectForm.value.data.tagIds,
      project.value.tags.map(({ id }) => id)
    )
)

watch(
  () => project.value.tags,
  (value: Tag[]) => {
    tagList.value = value
  },
  { deep: true, immediate: true } // TODO : test if we need deep
)

watch(
  tagList,
  (value: Tag[]) => {
    projectForm.value.data.tagIds = value.map(({ id }) => id)
  },
  { immediate: true }
)

function removeTag(id: number): void {
  tagList.value = tagList.value.filter(tag => tag.id !== id)
}

function toggleProjectArchiveState(): void {
  projectStore.updateProperties({ archived: !project.value.archived })
  resetForm()
}

function resetForm(): void {
  projectForm.value.data = {
    name: project.value.name,
    description: project.value.description,
    tagIds: [],
  }
  formRef.value.resetValidation()
}

function updateProject(): void {
  projectStore.updateProperties(projectForm.value.data)
}

function deleteProject(): void {
  projectApi.deleteProject(project.value.id).then(
    () => router.push({ name: 'project-list' }),
    error => console.error(error)
  )
}
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-sm-row align-stretch column-gap-2 row-gap-1 mb-3">
      <h4 class="text-h6 text-sm-h5 flex-grow-1">Settings</h4>

      <div class="d-flex gap-2">
        <ConfirmDialog @confirm="toggleProjectArchiveState()">
          <template #activator="{ attrs, on }">
            <v-btn
              v-bind="attrs"
              :variant="!project.archived ? 'outlined' : 'elevated'"
              :size="display.xs ? 'small' : 'default'"
              color="accent"
              class="flex-grow-1 flex-sm-grow-0"
              v-on="on">
              <v-icon size="small" start>mdi-archive</v-icon>
              {{ project.archived ? 'unarchive' : 'archive' }}
            </v-btn>
          </template>
          <template #icon>
            <v-icon size="x-large">mdi-archive</v-icon>
          </template>
          <span>
            Are you sure to
            {{ project.archived ? 'unarchive' : 'archive' }} this project ?
          </span>
        </ConfirmDialog>
        <template v-if="project.archived">
          <ConfirmDialog @confirm="deleteProject()">
            <template #activator="{ attrs, on }">
              <v-btn
                v-bind="attrs"
                variant="outlined"
                :size="display.xs ? 'small' : 'default'"
                color="error"
                class="flex-grow-1 flex-sm-grow-0"
                v-on="on">
                <v-icon size="small" start>mdi-trash-can</v-icon>
                delete
              </v-btn>
            </template>
            <template #icon>
              <v-icon size="x-large">mdi-trash-can</v-icon>
            </template>
            <p class="mb-1">Are you sure to delete this project ?</p>
            <p class="mb-0 font-italic" style="font-size: 1.1rem">
              All related tasks will be deleted
            </p>
          </ConfirmDialog>
        </template>
      </div>
    </div>

    <v-form
      ref="form"
      v-model="projectForm.valid"
      class="form-wrapper"
      @submit.prevent="updateProject()">
      <v-text-field
        v-model="projectForm.data.name"
        :rules="projectForm.rules.name"
        :disabled="project.archived"
        label="Name"
        counter="50"
        required
        class="mb-2" />
      <v-textarea
        v-model="projectForm.data.description"
        :rules="projectForm.rules.description"
        :disabled="project.archived"
        label="Description"
        counter="500"
        required
        rows="2"
        auto-grow
        class="mb-2"
        @keyup.enter.ctrl="updateProject()" />

      <h6
        class="text-h6 text-grey"
        :class="{
          'text--lighten-2': !project.archived,
          'text--darken-2': project.archived,
        }">
        <v-icon size="small" :color="project.archived ? 'grey darken-2' : 'grey lighten-2'">
          mdi-tag
        </v-icon>
        Tags
      </h6>
      <TagSearch v-model="tagList" :disabled="project.archived" type="project" class="mb-3" />

      <div v-if="tagList.length > 0" class="tag-wrapper">
        <TagChip
          v-for="tag of tagList"
          :key="tag.id"
          :tag
          :disabled="project.archived"
          :clearable="true"
          @clear="removeTag($event)" />
      </div>

      <div v-if="!project.archived" class="d-flex justify-end mb-5">
        <v-btn
          color="success"
          type="submit"
          :block="display.xs"
          :disabled="!projectForm.valid || isFormUntouched">
          update
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<style scoped lang="scss">
@import 'vuetify/settings';

@media #{map-get($display-breakpoints, 'md-and-up')} {
  .form-wrapper {
    width: 75%;
  }
}

.tag-wrapper {
  min-height: 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}
</style>
