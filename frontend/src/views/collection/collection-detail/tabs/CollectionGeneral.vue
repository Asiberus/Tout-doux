<script setup lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import ProgressWheel from '@/components/ProgressWheel.vue'
import { CollectionDetail } from '@/models/collection.model'
import { TaskPatch, TaskPost } from '@/models/task.model'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import TaskCard from '@/views/components/task/TaskCard.vue'
import { getDialogWidth } from '@/utils/dialog.utils'
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useDisplay } from 'vuetify'
import { useCollectionStore, usePreferencesStore } from '@/store'
import { dateFormat } from '@/pipes'

const display = useDisplay()

const preferencesStore = usePreferencesStore()
const collectionStore = useCollectionStore()

onMounted(() => {
  if (display.xs)
    isDescriptionOverflowing.value =
      descriptionElement.value.scrollHeight > descriptionElement.value.clientHeight
})

const descriptionElement = useTemplateRef('description')

const taskDialog = ref(false)
const displayCompletedTask = ref(false)

const displayDescription = ref(false)
const isDescriptionOverflowing = ref(false)

const collection = computed<CollectionDetail>(() => collectionStore.currentCollection)
const progressWheelSize = computed<'x-small' | 'small' | 'medium' | 'large' | 'x-large'>(() => {
  if (display.xs) return 'x-small'
  if (display.smAndDown) return 'small'
  else if (display.mdAndDown) return 'medium'
  else if (display.lgAndDown) return 'large'
  else return 'x-large'
})

function createTask(task: TaskPost): void {
  taskDialog.value = false
  task.collectionId = collectionStore.currentCollection.id
  collectionStore.addTask(task)
}

function toggleTaskState(id: number, completed: boolean): void {
  collectionStore.editTask(id, completed)
}

function updateTask(id: number, data: TaskPatch): void {
  collectionStore.editTask(id, data)
}

function deleteTask(id: number): void {
  collectionStore.deleteTask(id)
}
</script>

<template>
  <div class="collection-general">
    <div class="collection-general__tasks">
      <div class="d-flex flex-column flex-sm-row flex-wrap column-gap-2 row-gap-1 mb-2">
        <h5 class="text-h6 text-sm-h5 flex-grow-1">List of {{ collection.itemName }}</h5>

        <div class="d-flex justify-space-between align-center gap-2">
          <FilterChip
            v-if="collection.tasks.length > 0"
            v-model="displayCompletedTask"
            color="green-darken-2"
            icon="mdi-trophy"
            class="flex-shrink-0">
            Completed
          </FilterChip>

          <v-dialog v-model="taskDialog" :width="getDialogWidth()" :fullscreen="display.smAndDown">
            <template #activator="{ props }">
              <v-btn
                :disabled="collection.archived"
                :size="display.xs && collection.itemName.length > 10 ? 'small' : 'default'"
                :block="display.xs && collection.tasks.length === 0"
                v-bind="props">
                <v-icon start>mdi-plus</v-icon>
                {{ collection.itemName }}
              </v-btn>
            </template>
            <TaskDialog
              :is-dialog-open="taskDialog"
              :item-name="collection.itemName"
              @create="createTask"
              @close="taskDialog = false">
            </TaskDialog>
          </v-dialog>
        </div>
      </div>

      <template v-if="!displayCompletedTask">
        <template v-if="collectionStore.uncompletedTasks.length > 0">
          <TaskCard
            v-for="task in collectionStore.uncompletedTasks"
            :key="task.id"
            :task="task"
            :disabled="collection.archived"
            :item-name="collection.itemName"
            class="mb-2"
            @toggle-state="toggleTaskState"
            @update="updateTask"
            @delete="deleteTask" />
        </template>
        <template
          v-else-if="
            collection.tasks.length > 0 &&
            collection.tasks.length === collectionStore.completedTasks.length
          ">
          <EmptyListDisplay
            :message="`You completed all the ${collection.itemName} of this collection!`"
            class="empty-list-display">
            <template #img>
              <img
                src="../../../../assets/all_task_completed.svg"
                alt="All tasks completed"
                class="empty-list-display__img" />
            </template>
          </EmptyListDisplay>
        </template>
        <template v-else>
          <EmptyListDisplay
            :message="`This collection has no ${collection.itemName}.`"
            class="empty-list-display">
            <template #img>
              <img
                src="../../../../assets/collection-no-tasks.svg"
                alt="No tasks"
                class="empty-list-display__img" />
            </template>
          </EmptyListDisplay>
        </template>
      </template>
      <template v-else>
        <template v-if="collectionStore.completedTasks.length > 0">
          <TaskCard
            v-for="task of collectionStore.completedTasks"
            :key="task.id"
            :task="task"
            :disabled="collection.archived"
            :item-name="collection.itemName"
            class="mb-2"
            @toggle-state="toggleTaskState"
            @update="updateTask"
            @delete="deleteTask">
          </TaskCard>
        </template>
        <template v-else>
          <EmptyListDisplay
            :message="`You didn't complete any ${collection.itemName} yet!`"
            class="empty-list-display">
            <template #img>
              <img
                src="../../../../assets/collection-no-tasks.svg"
                alt="No tasks"
                class="empty-list-display__img" />
            </template>
          </EmptyListDisplay>
        </template>
      </template>
    </div>

    <div class="collection-general__description">
      <div class="d-flex justify-center mb-2">
        <ProgressWheel
          :size="progressWheelSize"
          :mode="preferencesStore.preferences.progressWheelMode"
          :value="collectionStore.completedTasks.length"
          :max="collection.tasks.length"
          color="collection lighten-2">
        </ProgressWheel>
      </div>
      <h5 class="text-h6 text-sm-h5 mb-1 mb-lg-2">Description</h5>
      <v-card class="rounded-lg">
        <v-card-text>
          <div
            ref="description"
            class="collection-general__description__content text-body-2"
            :class="{
              'display-description': displayDescription,
              'cursor-pointer': isDescriptionOverflowing,
            }"
            @click="displayDescription = !displayDescription">
            {{ collection.description }}
          </div>

          <div class="d-flex justify-end align-center mt-1" title="Created on">
            <v-icon size="small">mdi-clock</v-icon>
            <span class="font-italic ml-1">{{ dateFormat(collection.createdOn, 'D MMMM Y') }}</span>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import 'vuetify/settings';

.collection-general {
  flex-grow: 1;
  display: flex;
  gap: 20px;

  &__tasks {
    flex: 0 2 calc((100% / 3) * 2 - 20px);
    min-width: 0;
    display: flex;
    flex-direction: column;

    .empty-list-display {
      flex-grow: 1;
      padding: 20px;

      &__img {
        width: clamp(200px, 50%, 300px);

        @media #{map-get($display-breakpoints, 'xl')} {
          width: clamp(200px, 50%, 450px);
        }
      }
    }
  }

  &__description {
    flex: 1 1 0;
    min-width: 200px;

    @media #{map-get($display-breakpoints, 'sm-and-down')} {
      &__content {
        max-height: calc(4.6 * 1.25rem); // Equal to 4.6 row
        transition: all 0.3s ease-out;

        &.display-description {
          height: fit-content;
          max-height: 500px;
        }

        &:not(.display-description) {
          text-overflow: ellipsis;
          overflow: hidden;
        }
      }
    }
  }
}

@media #{map-get($display-breakpoints, 'xs')} {
  .collection-general {
    flex-direction: column-reverse;

    &__tasks {
      flex: 1 0 auto;
    }

    &__description {
      flex: 0 0 auto;
    }
  }
}
</style>
