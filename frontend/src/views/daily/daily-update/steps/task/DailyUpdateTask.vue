<script setup lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { CollectionDetail } from '@/models/collection.model'
import {
  DailyTask,
  DailyTaskDisplayWrapper,
  DailyTaskPatch,
  DailyTaskPost,
  DailyUpdateTaskTab,
} from '@/models/daily-task.model'
import { ProjectDetail } from '@/models/project.model'
import DailyUpdateCollectionListItem from '@/views/daily/daily-update/steps/task/components/DailyUpdateCollectionListItem.vue'
import DailyUpdateProjectListItem from '@/views/daily/daily-update/steps/task/components/DailyUpdateProjectListItem.vue'
import DailyUpdateTaskList from '@/views/daily/daily-update/steps/task/components/DailyUpdateTaskList.vue'
import DailyUpdateCommonTask from '@/views/daily/daily-update/steps/task/components/DailyUpdateCommonTask.vue'
import { CommonTask } from '@/models/common-task.model'
import { collectionApi, commonTaskApi, dailyTaskApi, projectApi } from '@/api'
import { computed, onBeforeMount, ref } from 'vue'
import { useDisplay } from 'vuetify'

// Todo : add btn to create project in no project svg
// Todo : add btn to create collection in no collection svg

const display = useDisplay()

const props = defineProps<{
  date: string
}>()

const emit = defineEmits<{
  'daily-task-count': [count: number]
}>()

onBeforeMount(() => {
  retrieveDailyTaskList()
  retrieveProjectList()
  retrieveCollectionList()
  fetchCommonTaskList()
})

const dailyTaskList = ref<DailyTask[]>([])
const projectList = ref<DailyTaskDisplayWrapper<ProjectDetail>[]>([])
const collectionList = ref<DailyTaskDisplayWrapper<CollectionDetail>[]>([])
const commonTaskList = ref<CommonTask[]>([])

const taskTab = ref<DailyUpdateTaskTab>(DailyUpdateTaskTab.Project)
const projectSectionSelected = ref(0)

const areSomeProjectSelected = computed<boolean>(() =>
  projectList.value.some(({ selected }) => selected)
)
const areSomeCollectionSelected = computed<boolean>(() =>
  collectionList.value.some(({ selected }) => selected)
)

function retrieveDailyTaskList(): void {
  dailyTaskApi
    .getDailyTasksByDate(props.date) // TODO : test the date format
    .then(response => {
      dailyTaskList.value = response.content
      emit('daily-task-count', dailyTaskList.value.length)
    })
    .catch(error => console.error(error))
}

function retrieveProjectList(): void {
  projectApi
    .getProjectListDetailed({ archived: false, has_uncompleted_task: true })
    .then(response => {
      projectList.value = response.content.map((project: ProjectDetail) => ({
        content: project,
        selected: false,
      }))
    })
    .catch(error => console.error(error))
}

function retrieveCollectionList(): void {
  collectionApi
    .getCollectionListDetailed({ archived: false, has_uncompleted_task: true })
    .then(response => {
      collectionList.value = response.content.map((collection: CollectionDetail) => ({
        content: collection,
        selected: false,
      }))
    })
    .catch(error => console.error(error))
}

function fetchCommonTaskList(): void {
  commonTaskApi
    .getCommonTaskList({ size: 0 })
    .then(response => (commonTaskList.value = response.content))
    .catch(error => console.error(error))
}

function createDailyTask(data: DailyTaskPost): void {
  dailyTaskApi
    .createDailyTask(data)
    .then(response => {
      dailyTaskList.value.push(response)
      emit('daily-task-count', dailyTaskList.value.length)
    })
    .catch(error => console.error(error))
}

function updateDailyTask(event: { id: number; data: DailyTaskPatch }): void {
  const { id, data } = event

  dailyTaskApi
    .updateDailyTask(id, data)
    .then(response => {
      const dailyTask = dailyTaskList.value.find(d => d.id === response.id)
      if (dailyTask) Object.assign(dailyTask, response)
    })
    .catch(error => console.error(error))
}

function deleteDailyTask(id: number): void {
  dailyTaskApi
    .deleteDailyTask(id)
    .then(() => {
      const index = dailyTaskList.value.findIndex(dailyTask => dailyTask.id === id)
      if (index !== -1) {
        dailyTaskList.value.splice(index, 1)
        emit('daily-task-count', dailyTaskList.value.length)
      }
    })
    .catch(error => console.error(error))
}

function select(event: { tab: DailyUpdateTaskTab; id: number; sectionId: number }): void {
  const { tab, id, sectionId } = event

  taskTab.value = tab
  resetSelectedItem()

  if (taskTab.value === DailyUpdateTaskTab.Project) {
    projectList.value = projectList.value.map(({ content }) => ({
      content,
      selected: content.id === id,
    }))
    projectSectionSelected.value = sectionId ?? 0
  } else {
    collectionList.value = collectionList.value.map(({ content }) => ({
      content,
      selected: content.id === id,
    }))
  }
}

function resetSelectedItem(): void {
  projectList.value = projectList.value.map(item => ({ ...item, selected: false }))
  collectionList.value = collectionList.value.map(item => ({ ...item, selected: false }))
}
</script>

<template>
  <div class="daily-update-task">
    <v-tabs
      v-model="taskTab"
      bg-color="transparent"
      color="accent variant-1"
      :direction="display.mdAndUp ? 'vertical' : 'horizontal'"
      :grow="display.smAndDown"
      show-arrows
      class="daily-update-task__tabs"
      @update:model-value="resetSelectedItem()">
      <v-tab>
        <v-icon>mdi-briefcase-variant</v-icon>
      </v-tab>
      <v-tab>
        <v-icon>mdi-list-box</v-icon>
      </v-tab>
      <v-tab>
        <v-icon>mdi-timeline</v-icon>
      </v-tab>
      <v-tab disabled>
        <v-icon>mdi-calendar-range</v-icon>
      </v-tab>
      <v-tab disabled>
        <v-icon>mdi-calendar-month</v-icon>
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="taskTab" touchless class="daily-update-task__tabs-items bg-transparent">
      <v-tab-item :transition="false">
        <div class="d-flex align-center mb-3">
          <h5 class="text-h5 mr-2">Project</h5>
          <v-hover v-slot="{ hover }">
            <v-btn
              :to="{ name: 'project-list' }"
              :exact="true"
              icon
              size="small"
              :color="hover ? 'grey' : 'grey darken-3'"
              title="Go to project list">
              <v-icon size="small">mdi-open-in-new</v-icon>
            </v-btn>
          </v-hover>
        </div>
        <div
          class="daily-update-task__tabs-items__content"
          :class="{ overflow: !areSomeProjectSelected }">
          <template v-if="projectList.length">
            <div class="project-wrapper">
              <DailyUpdateProjectListItem
                v-for="project in projectList"
                :key="'project-' + project.content.id"
                v-model:selected="project.selected"
                :project="project.content"
                :daily-task-list="dailyTaskList"
                :section-selected="projectSectionSelected"
                @select-task="createDailyTask($event)" />
            </div>
          </template>
          <template v-else>
            <EmptyListDisplay message="No project available." class="empty-list-display">
              <template #img>
                <img
                  src="../../../../../assets/project-empty.svg"
                  alt="No Project"
                  class="empty-list-display__img" />
              </template>
            </EmptyListDisplay>
          </template>
        </div>
      </v-tab-item>
      <v-tab-item :transition="false">
        <div class="d-flex align-center mb-3">
          <h5 class="text-h5 mr-2">Collection</h5>
          <v-hover v-slot="{ hover }">
            <v-btn
              :to="{ name: 'collection-list' }"
              :exact="true"
              icon
              size="small"
              :color="hover ? 'grey' : 'grey darken-3'"
              title="Go to collection">
              <v-icon size="small">mdi-open-in-new</v-icon>
            </v-btn>
          </v-hover>
        </div>
        <div
          class="daily-update-task__tabs-items__content"
          :class="{ overflow: !areSomeCollectionSelected }">
          <template v-if="collectionList.length">
            <div class="collection-wrapper">
              <DailyUpdateCollectionListItem
                v-for="collection in collectionList"
                :key="'collection-' + collection.content.id"
                v-model:selected="collection.selected"
                :collection="collection.content"
                :daily-task-list="dailyTaskList"
                @select-task="createDailyTask($event)" />
            </div>
          </template>
          <template v-else>
            <EmptyListDisplay message="No collection available." class="empty-list-display">
              <template #img>
                <img
                  src="../../../../../assets/collection-empty.svg"
                  alt="No Collection"
                  class="empty-list-display__img" />
              </template>
            </EmptyListDisplay>
          </template>
        </div>
      </v-tab-item>
      <v-tab-item :transition="false">
        <div class="d-flex align-center mb-3">
          <h5 class="text-h5 mr-2">Common task</h5>
          <v-hover v-slot="{ hover }">
            <v-btn
              :to="{ name: 'settings-common-tasks' }"
              :exact="true"
              icon
              size="small"
              :color="hover ? 'grey' : 'grey darken-3'"
              title="Go to common task">
              <v-icon size="small">mdi-open-in-new</v-icon>
            </v-btn>
          </v-hover>
        </div>
        <div class="daily-update-task__tabs-items__content overflow">
          <DailyUpdateCommonTask
            :common-task-list="commonTaskList"
            :daily-task-list="dailyTaskList"
            @select-common-task="createDailyTask($event)" />
        </div>
      </v-tab-item>
      <v-tab-item :transition="false">
        <h5 class="text-h5 mb-3">Weekly task</h5>
      </v-tab-item>
      <v-tab-item :transition="false">
        <h5 class="text-h5 mb-3">Monthly task</h5>
      </v-tab-item>
    </v-tabs-items>

    <DailyUpdateTaskList
      :daily-task-list="dailyTaskList"
      class="daily-update-task__list"
      @create="createDailyTask($event)"
      @update="updateDailyTask($event)"
      @delete="deleteDailyTask($event)"
      @select="select($event)" />
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.daily-update-task {
  height: 100%;
  display: flex;
  gap: 16px;

  &__tabs {
    flex: 0 0 0;
  }

  &__tabs-items {
    flex: 1 1 auto;

    &__content {
      position: relative;

      @media #{map.get(variables.$display-breakpoints, 'md-and-up')} {
        flex: 1 0 0;
      }

      &.overflow {
        overflow: auto;
      }

      .project-wrapper,
      .collection-wrapper {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(215px, 1fr));
        grid-auto-rows: min-content;
        gap: 8px;

        @media only screen and (min-width: 1600px) {
          grid-template-columns: repeat(
            auto-fill,
            minmax(max(260px, calc((100% - 16px) / 3)), 1fr)
          );
        }

        & > * {
          min-width: 0;
        }
      }

      .empty-list-display {
        height: 100%;

        &__img {
          width: clamp(200px, 50%, 300px);
        }
      }
    }
  }

  &__list {
    flex: 0 0 33%;
    width: 33%;
  }
}

@media #{map.get(variables.$display-breakpoints, 'md-and-down')} {
  .daily-update-task__tabs {
    .v-tab {
      min-width: initial;
      height: 40px;
    }
  }
}

@media #{map.get(variables.$display-breakpoints, 'sm-and-down')} {
  .daily-update-task {
    flex-direction: column;

    &__tabs {
      .v-tab {
        min-width: initial;
        height: 48px;
      }
    }

    &__tabs-items {
      flex: 0 1 auto;

      &__content {
        flex-grow: 0;
        height: 50svh;
      }
    }

    &__list {
      width: auto;
    }
  }
}
</style>
