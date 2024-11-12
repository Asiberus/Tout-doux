<script setup lang="ts">
import { CollectionList } from '@/models/collection.model'
import TaskCounter from '@/components/TaskCounter.vue'
import { computed } from 'vue'

const { collection } = defineProps<{
  collection: CollectionList
}>()

const percentageOfCompletedTask = computed<number>(
  () => (collection.completedTaskCount / collection.taskCount) * 100
)
</script>

<template>
  <v-card
    rounded
    :to="{ name: 'collection-detail', params: { id: collection.id } }"
    :color="collection.archived ? 'collectionArchived' : null"
    :ripple="false"
    class="rounded-lg">
    <v-progress-linear
      :model-value="percentageOfCompletedTask"
      color="collection lighten-2"
      height="6">
    </v-progress-linear>
    <v-card-text class="d-flex justify-space-between align-center gap-1 pa-3 pa-sm-4">
      <div class="flex-shrink-1 overflow-hidden">
        <h5
          class="text-h6 text-sm-h5 text-white font-weight-bold text-truncate"
          :title="collection.name">
          {{ collection.name }}
        </h5>
        <p
          class="text-subtitle-2 text-sm-subtitle-1 text-truncate mb-0"
          :title="collection.description">
          {{ collection.description }}
        </p>
      </div>

      <TaskCounter
        v-if="collection.taskCount > 0"
        :value="collection.completedTaskCount"
        :max="collection.taskCount">
      </TaskCounter>
    </v-card-text>
  </v-card>
</template>
