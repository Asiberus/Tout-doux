<script setup lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { CollectionDetail } from '@/models/collection.model'
import {
  DailyTask,
  DailyTaskDisplayWrapper,
  DailyTaskDraft,
  DailyTaskPatch,
  DailyTaskSheetDetent,
  DailyUpdateTaskTab,
} from '@/models/daily-task.model'
import { ProjectDetail } from '@/models/project.model'
import { Task, TaskPost } from '@/models/task.model'
import { insertByPosition, isStaleListError, moveFailureMessage } from '@/utils/ordering.utils'
import DailyUpdateCollectionListItem from '@/views/daily/daily-update/steps/task/components/DailyUpdateCollectionListItem.vue'
import DailyUpdateProjectListItem from '@/views/daily/daily-update/steps/task/components/DailyUpdateProjectListItem.vue'
import DailyUpdateTaskList from '@/views/daily/daily-update/steps/task/components/DailyUpdateTaskList.vue'
import DailyTaskBottomSheet from '@/views/daily/daily-update/steps/task/components/DailyTaskBottomSheet.vue'
import DailyUpdateCommonTask from '@/views/daily/daily-update/steps/task/components/DailyUpdateCommonTask.vue'
import DailyUpdateDue from '@/views/daily/daily-update/steps/task/components/DailyUpdateDue.vue'
import { CommonTask, CommonTaskForm } from '@/models/common-task.model'
import { collectionApi, commonTaskApi, dailyTaskApi, projectApi, taskApi } from '@/api'
import { dueDateChangeMessage } from '@/utils/due-date.utils'
import { flattenProjectTasks } from '@/utils/task.utils'
import { useDueStore, useNotificationStore } from '@/store'
import { useDailyTaskMove } from '@/composables/useDailyTaskMove'
import { useRequestScope } from '@/composables/useRequestScope'
import { useToday } from '@/composables/useToday'
import { isCancel } from 'axios'
import {
  collectDueEntries,
  DueGroups,
  dueEntryCount,
  initialDailyUpdateTab,
  unplannedCount,
} from '@/utils/daily-due.utils'
import { computed, onBeforeMount, Ref, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

// Todo : add btn to create project in no project svg
// Todo : add btn to create collection in no collection svg

// Au-delà de ce nombre de tâches, le « + » déroule la feuille en grand : à mi-hauteur le
// formulaire naîtrait trop loin sous le bord du défileur
const SHEET_FULL_TASK_COUNT = 5

const { mdAndUp, smAndDown } = useDisplay()
const notificationStore = useNotificationStore()
const dueStore = useDueStore()

const props = defineProps<{
  date: string
  readonly: boolean
}>()

const emit = defineEmits<{
  'daily-task-count': [count: number]
}>()

defineExpose({ refresh: retrieveDailyTaskList })

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
const carryOverCandidates = ref<DailyTask[]>([])
const carryOverInProgress = ref(false)
const { moveDailyTask } = useDailyTaskMove(dailyTaskList, retrieveDailyTaskList)
const dayRequests = useRequestScope()

const taskTab = ref<DailyUpdateTaskTab | null>(null)
const dailyTasksLoaded = ref(false)
const projectsLoaded = ref(false)
const collectionsLoaded = ref(false)
const projectSectionSelected = ref(0)

const taskSheetDetent = ref<DailyTaskSheetDetent>(DailyTaskSheetDetent.Collapsed)
const createTaskDisplayed = ref(false)
const editedTaskId = ref<number | null>(null)

watch(createTaskDisplayed, value => {
  if (!value || taskSheetDetent.value !== DailyTaskSheetDetent.Collapsed) return

  taskSheetDetent.value =
    dailyTaskList.value.length > SHEET_FULL_TASK_COUNT
      ? DailyTaskSheetDetent.Full
      : DailyTaskSheetDetent.Half
})

watch(taskSheetDetent, value => {
  if (!smAndDown.value || value !== DailyTaskSheetDetent.Collapsed) return

  createTaskDisplayed.value = false
  editedTaskId.value = null
})

const { today } = useToday()
const isToday = computed<boolean>(() => today.value.isSame(props.date, 'day'))
const areSomeProjectSelected = computed<boolean>(() =>
  projectList.value.some(({ selected }) => selected)
)
const areSomeCollectionSelected = computed<boolean>(() =>
  collectionList.value.some(({ selected }) => selected)
)
const dueGroups = computed<DueGroups>(() =>
  collectDueEntries(
    projectList.value.map(({ content }) => content),
    collectionList.value.map(({ content }) => content),
    dailyTaskList.value,
    props.date
  )
)
const dueCount = computed<number>(() => dueEntryCount(dueGroups.value))
const dueBadgeColor = computed<string>(() => {
  if (dueGroups.value.overdue.length > 0) return 'red-accent-2'
  if (dueGroups.value.today.length > 0) return 'orange'
  return 'amber'
})

const dayLoaded = computed<boolean>(
  () => dailyTasksLoaded.value && projectsLoaded.value && collectionsLoaded.value
)

watch([dayLoaded, (): boolean => props.readonly], chooseInitialTab, { immediate: true })
watch(
  () => props.readonly,
  readonly => {
    if (readonly && taskTab.value === DailyUpdateTaskTab.Due)
      taskTab.value = DailyUpdateTaskTab.Project
  }
)

watch(
  () => props.date,
  () => {
    dayRequests.renew()
    taskTab.value = null
    dailyTasksLoaded.value = false
    projectsLoaded.value = false
    collectionsLoaded.value = false
    // Les listes sont vidées avant le fetch : sans ça celles de la veille resteraient affichées
    // sous l'en-tête du nouveau jour le temps de l'aller-retour.
    dailyTaskList.value = []
    emit('daily-task-count', 0)
    carryOverCandidates.value = []
    projectSectionSelected.value = 0
    resetSelectedItem()
    retrieveDailyTaskList()
    retrieveProjectList()
    retrieveCollectionList()
  }
)

function logUnlessCanceled(error: unknown): void {
  if (!isCancel(error)) console.error(error)
}

function markLoadedUnlessCanceled(loaded: Ref<boolean>): (error: unknown) => void {
  return error => {
    if (isCancel(error)) return
    console.error(error)
    loaded.value = true
  }
}

function chooseInitialTab(): void {
  if (taskTab.value !== null) return
  taskTab.value = initialDailyUpdateTab(
    props.readonly,
    dayLoaded.value,
    unplannedCount(dueGroups.value)
  )
}

function retrieveDailyTaskList(): void {
  dailyTaskApi
    .getDailyTasksByDate(props.date, dayRequests.signal()) // TODO : test the date format
    .then(response => {
      dailyTaskList.value = response.content
      dailyTasksLoaded.value = true
      emit('daily-task-count', dailyTaskList.value.length)
      // Les deux endpoints de report sont codés « veille → aujourd'hui », sans paramètre. Ne pas
      // interroger les candidats hors du jour courant est ce qui empêche le bouton d'apparaître
      // sur un jour à venir, où il écrirait dans aujourd'hui sans le dire.
      if (isToday.value && dailyTaskList.value.length === 0) retrieveCarryOverCandidates()
    })
    .catch(markLoadedUnlessCanceled(dailyTasksLoaded))
}

function retrieveCarryOverCandidates(): void {
  dailyTaskApi
    .getCarryOverCandidates(dayRequests.signal())
    .then(response => (carryOverCandidates.value = response))
    .catch(logUnlessCanceled)
}

function carryOverPreviousDay(): void {
  if (carryOverInProgress.value) return

  carryOverInProgress.value = true
  const { date } = props

  dailyTaskApi
    .carryOverPreviousDay()
    .then(response => {
      dueStore.refresh({ force: true })
      if (date !== props.date) return

      carryOverCandidates.value = []

      if (response.length === 0) {
        notificationStore.notifySuccess('Nothing left to copy from yesterday')
        return
      }

      dailyTaskList.value.push(...response)
      emit('daily-task-count', dailyTaskList.value.length)
      taskSheetDetent.value =
        response.length > SHEET_FULL_TASK_COUNT
          ? DailyTaskSheetDetent.Full
          : DailyTaskSheetDetent.Half
      notificationStore.notifySuccess(
        response.length === 1
          ? '1 task copied from yesterday'
          : `${response.length} tasks copied from yesterday`
      )
    })
    .catch(error => {
      console.error(error)
      notificationStore.notifyError("Could not copy yesterday's tasks")
    })
    .finally(() => (carryOverInProgress.value = false))
}

function retrieveProjectList(): void {
  projectApi
    .getProjectListDetailed({ daily_task_date: props.date }, dayRequests.signal())
    .then(response => {
      projectList.value = response.content.map((project: ProjectDetail) => ({
        content: project,
        selected: false,
      }))
      projectsLoaded.value = true
    })
    .catch(markLoadedUnlessCanceled(projectsLoaded))
}

function retrieveCollectionList(): void {
  collectionApi
    .getCollectionListDetailed({ daily_task_date: props.date }, dayRequests.signal())
    .then(response => {
      collectionList.value = response.content.map((collection: CollectionDetail) => ({
        content: collection,
        selected: false,
      }))
      collectionsLoaded.value = true
    })
    .catch(markLoadedUnlessCanceled(collectionsLoaded))
}

function fetchCommonTaskList(): void {
  commonTaskApi
    .getCommonTaskList({ size: 0 })
    .then(response => (commonTaskList.value = response.content))
    .catch(error => console.error(error))
}

function createDailyTask(data: DailyTaskDraft): Promise<void> {
  const { date } = props
  return dailyTaskApi
    .createDailyTask({ ...data, date })
    .then(response => {
      dueStore.refresh({ force: true })
      if (date !== props.date) return

      dailyTaskList.value.push(response)
      emit('daily-task-count', dailyTaskList.value.length)
    })
    .catch(error => console.error(error))
}

function lastOpenTaskId(tasks: Task[]): number | null {
  return tasks.findLast(({ completed }) => !completed)?.id ?? null
}

function notifyStaleList(error: unknown): void {
  notificationStore.notifyError(moveFailureMessage(error))
}

function createProjectTask(event: { task: TaskPost; projectId: number }): void {
  const { task, projectId } = event
  const project = projectList.value.find(({ content }) => content.id === projectId)
  if (!project) return

  const tasks = task.sectionId
    ? project.content.sections.find(({ id }) => id === task.sectionId)?.tasks
    : project.content.tasks
  if (!tasks) return

  taskApi.createTask({ ...task, afterId: lastOpenTaskId(tasks), beforeId: null }).then(
    response => {
      dueStore.refresh({ force: true })
      insertByPosition(tasks, response)
    },
    error => {
      console.error(error)
      if (!isStaleListError(error)) return
      notifyStaleList(error)
      projectApi.getProjectById(projectId).then(
        response => (project.content = response),
        reloadError => console.error(reloadError)
      )
    }
  )
}

function createCollectionTask(event: { task: TaskPost; collectionId: number }): void {
  const { task, collectionId } = event
  const collection = collectionList.value.find(({ content }) => content.id === collectionId)
  if (!collection) return

  const { tasks } = collection.content
  taskApi.createTask({ ...task, afterId: lastOpenTaskId(tasks), beforeId: null }).then(
    response => {
      dueStore.refresh({ force: true })
      insertByPosition(tasks, response)
    },
    error => {
      console.error(error)
      if (!isStaleListError(error)) return
      notifyStaleList(error)
      collectionApi.getCollectionById(collectionId).then(
        response => (collection.content = response),
        reloadError => console.error(reloadError)
      )
    }
  )
}

function planTasks(taskIds: number[]): Promise<void> {
  // Une à une, pour que la liste du jour garde l'ordre de la section
  return taskIds.reduce<Promise<void>>(
    (previous, taskId) => previous.then(() => createDailyTask({ taskId })),
    Promise.resolve()
  )
}

function findLoadedTask(taskId: number): Task | undefined {
  const tasks = [
    ...projectList.value.flatMap(({ content }) => flattenProjectTasks(content)),
    ...collectionList.value.flatMap(({ content }) => content.tasks),
  ]
  return tasks.find(({ id }) => id === taskId)
}

function rescheduleTask(event: { taskId: number; dueDate: string | null }): void {
  const { taskId, dueDate } = event
  taskApi.updateTaskById(taskId, { dueDate }).then(
    response => {
      const task = findLoadedTask(taskId)
      if (task) Object.assign(task, response)
      dailyTaskList.value
        .filter(dailyTask => dailyTask.task?.id === taskId)
        .forEach(dailyTask => {
          if (dailyTask.task) dailyTask.task.dueDate = response.dueDate
        })
      dueStore.refresh({ force: true })
      notificationStore.notifySuccess(dueDateChangeMessage(response.dueDate))
    },
    error => console.error(error)
  )
}

function createCommonTask(data: CommonTaskForm): void {
  commonTaskApi.createCommonTask(data).then(
    response => commonTaskList.value.push(response),
    error => console.error(error)
  )
}

function updateDailyTask(event: { id: number; data: DailyTaskPatch }): void {
  const { id, data } = event

  dailyTaskApi
    .updateDailyTask(id, data)
    .then(response => {
      dueStore.refresh({ force: true })
      const dailyTask = dailyTaskList.value.find(d => d.id === response.id)
      if (dailyTask) Object.assign(dailyTask, response)
    })
    .catch(error => console.error(error))
}

function deleteDailyTask(id: number): void {
  dailyTaskApi
    .deleteDailyTask(id)
    .then(() => {
      dueStore.refresh({ force: true })
      const index = dailyTaskList.value.findIndex(dailyTask => dailyTask.id === id)
      if (index !== -1) {
        dailyTaskList.value.splice(index, 1)
        emit('daily-task-count', dailyTaskList.value.length)
        if (isToday.value && dailyTaskList.value.length === 0) retrieveCarryOverCandidates()
      }
    })
    .catch(error => console.error(error))
}

function select(event: { tab: DailyUpdateTaskTab; id: number; sectionId?: number }): void {
  const { tab, id, sectionId } = event

  // La sélection se joue dans les onglets, derrière la feuille : elle se replie pour les découvrir
  if (smAndDown.value) taskSheetDetent.value = DailyTaskSheetDetent.Collapsed

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
    <!-- `mandatory` forcé sélectionnerait le premier onglet avant que le jour soit chargé -->
    <v-tabs
      v-model="taskTab"
      bg-color="transparent"
      color="accent"
      :direction="mdAndUp ? 'vertical' : 'horizontal'"
      :grow="smAndDown"
      :mandatory="taskTab === null ? false : 'force'"
      show-arrows
      class="daily-update-task__tabs"
      @update:model-value="resetSelectedItem()">
      <v-tab v-if="!readonly" :value="DailyUpdateTaskTab.Due" title="Due tasks">
        <v-badge :model-value="dayLoaded && dueCount > 0" dot :color="dueBadgeColor">
          <v-icon icon="mdi-calendar-alert" size="x-large" />
        </v-badge>
      </v-tab>
      <v-tab :value="DailyUpdateTaskTab.Project">
        <v-icon icon="mdi-briefcase-variant" size="x-large" />
      </v-tab>
      <v-tab :value="DailyUpdateTaskTab.Collection">
        <v-icon icon="mdi-list-box" size="x-large" />
      </v-tab>
      <v-tab :value="DailyUpdateTaskTab.CommonTask">
        <v-icon icon="mdi-timeline" size="x-large" />
      </v-tab>
    </v-tabs>

    <v-tabs-window
      v-model="taskTab"
      :touch="false"
      class="daily-update-task__tabs-items bg-transparent">
      <v-tabs-window-item
        v-if="!readonly"
        :value="DailyUpdateTaskTab.Due"
        transition="v-window-crossfade-transition"
        reverse-transition="v-window-crossfade-transition">
        <div class="d-flex align-center mb-3">
          <h5 class="text-title-medium text-sm-headline-small font-weight-bold-sm-and-down mr-2">
            Due
          </h5>
        </div>
        <div class="daily-update-task__tabs-items__content overflow">
          <DailyUpdateDue
            :groups="dueGroups"
            :date
            @select-task="createDailyTask($event)"
            @select="select($event)"
            @reschedule="rescheduleTask($event)"
            @plan-tasks="planTasks($event)" />
        </div>
      </v-tabs-window-item>
      <v-tabs-window-item
        :value="DailyUpdateTaskTab.Project"
        transition="v-window-crossfade-transition"
        reverse-transition="v-window-crossfade-transition">
        <div class="d-flex align-center mb-3">
          <h5 class="text-title-medium text-sm-headline-small font-weight-bold-sm-and-down mr-2">
            Project
          </h5>
          <v-btn
            :to="{ name: 'project-list' }"
            icon
            variant="text"
            color="grey"
            density="comfortable"
            size="small"
            title="Go to project list">
            <v-icon icon="mdi-open-in-new" size="small" />
          </v-btn>
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
                :readonly
                :date
                :section-selected="projectSectionSelected"
                @select-task="createDailyTask($event)"
                @create-task="createProjectTask($event)" />
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
      </v-tabs-window-item>
      <v-tabs-window-item
        :value="DailyUpdateTaskTab.Collection"
        transition="v-window-crossfade-transition"
        reverse-transition="v-window-crossfade-transition">
        <div class="d-flex align-center mb-3">
          <h5 class="text-title-medium text-sm-headline-small font-weight-bold-sm-and-down mr-2">
            Collection
          </h5>
          <v-btn
            :to="{ name: 'collection-list' }"
            icon
            variant="text"
            color="grey"
            density="comfortable"
            size="small"
            title="Go to collection">
            <v-icon icon="mdi-open-in-new" size="small" />
          </v-btn>
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
                :readonly
                :date
                @select-task="createDailyTask($event)"
                @create-task="createCollectionTask($event)" />
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
      </v-tabs-window-item>
      <v-tabs-window-item
        :value="DailyUpdateTaskTab.CommonTask"
        transition="v-window-crossfade-transition"
        reverse-transition="v-window-crossfade-transition">
        <div class="d-flex align-center mb-3">
          <h5 class="text-title-medium text-sm-headline-small font-weight-bold-sm-and-down mr-2">
            Common task
          </h5>
          <v-btn
            :to="{ name: 'settings-common-tasks' }"
            icon
            variant="text"
            color="grey"
            density="comfortable"
            size="small"
            title="Go to common task">
            <v-icon icon="mdi-open-in-new" size="small" />
          </v-btn>
        </div>
        <div class="daily-update-task__tabs-items__content overflow">
          <DailyUpdateCommonTask
            :common-task-list="commonTaskList"
            :daily-task-list="dailyTaskList"
            :readonly
            @select-common-task="createDailyTask($event)"
            @create-common-task="createCommonTask($event)" />
        </div>
      </v-tabs-window-item>
    </v-tabs-window>

    <DailyTaskBottomSheet v-model="taskSheetDetent">
      <DailyUpdateTaskList
        v-model:create-displayed="createTaskDisplayed"
        v-model:edited-task-id="editedTaskId"
        :date
        :daily-task-list="dailyTaskList"
        :readonly
        :carry-over-candidates="carryOverCandidates"
        :carry-over-in-progress="carryOverInProgress"
        class="daily-update-task__list"
        @create="createDailyTask($event)"
        @update="updateDailyTask($event)"
        @delete="deleteDailyTask($event)"
        @select="select($event)"
        @carry-over="carryOverPreviousDay()"
        @move="moveDailyTask($event.id, $event.anchors)" />
    </DailyTaskBottomSheet>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use '@/styles/breakpoints' as variables;

.daily-update-task {
  height: 100%;
  display: flex;
  gap: 8px;

  &__tabs {
    flex: 0 0 auto;

    &.v-slide-group--vertical .v-tab {
      justify-content: center;
    }
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

@media #{map.get(variables.$display-breakpoints, 'lg-and-up')} {
  .daily-update-task__tabs {
    .v-tab {
      min-width: initial;
    }
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
      flex: 1 1 0;
      min-height: 0;
      display: flex;
      flex-direction: column;

      // La chaîne est rendue extensible jusqu'au conteneur défilant : sans ça une carte ouverte,
      // en `position: absolute; height: 100%`, résout ce 100 % sur la hauteur du contenu replié
      > :deep(.v-window__container) {
        flex: 1 1 0;
        min-height: 0;

        > .v-window-item {
          flex: 1 1 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
      }

      &__content {
        flex: 1 1 0;
        min-height: 0;
      }
    }

    &__list {
      width: auto;
    }
  }
}
</style>
