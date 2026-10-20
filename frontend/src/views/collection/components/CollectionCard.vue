<script setup lang="ts">
import { CollectionList } from '@/models/collection.model'
import TaskCounter from '@/components/TaskCounter.vue'
import { useDueStore } from '@/store'
import DueCountChip from '@/views/components/task/DueCountChip.vue'
import { computed } from 'vue'

const { collection } = defineProps<{
  collection: CollectionList
}>()

const dueStore = useDueStore()

const due = computed(() => dueStore.containerDue('collection', collection.id))

const percentageOfCompletedTask = computed<number>(
  () => (collection.completedTaskCount / collection.taskCount) * 100
)
</script>

<template>
  <v-card
    rounded
    :to="{ name: 'collection-detail', params: { id: collection.id } }"
    :color="collection.archived ? 'collectionArchived' : undefined"
    :ripple="false"
    class="rounded-lg">
    <v-progress-linear :model-value="percentageOfCompletedTask" color="collection" height="6">
    </v-progress-linear>
    <v-card-text class="d-flex justify-space-between align-center gap-1 pa-3 pa-sm-4">
      <div class="flex-shrink-1 overflow-hidden">
        <h5
          class="text-title-large text-sm-headline-small text-white font-weight-bold text-truncate"
          :title="collection.name">
          {{ collection.name }}
        </h5>
        <p
          v-if="collection.description"
          class="text-title-small text-sm-body-large text-truncate mb-0"
          :title="collection.description">
          {{ collection.description }}
        </p>
      </div>

      <div class="d-flex flex-column gap-2 align-end">
        <DueCountChip
          v-if="!collection.archived && due.count > 0"
          :count="due.count"
          :late="due.late" />
        <TaskCounter
          v-if="collection.taskCount > 0"
          :value="collection.completedTaskCount"
          :max="collection.taskCount">
        </TaskCounter>
      </div>
    </v-card-text>
  </v-card>
</template>
