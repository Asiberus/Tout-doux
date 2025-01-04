<script setup lang="ts">
import { CommonTask } from '@/models/common-task.model'
import CommonTaskCard from '@/views/components/common-task/CommonTaskCard.vue'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { DailyTask } from '@/models/daily-task.model'

const props = defineProps<{
  commonTaskList: CommonTask[]
  dailyTaskList: DailyTask[]
}>()

const emit = defineEmits<{
  'select-common-task': [data: { commonTaskId: number }]
}>()

function selectCommonTask(id: number): void {
  if (isCommonTaskSelected(id)) return

  emit('select-common-task', { commonTaskId: id })
}

function isCommonTaskSelected(id: number): boolean {
  return props.dailyTaskList.some(({ commonTask }) => commonTask?.id === id)
}
</script>

<template>
  <div class="d-flex flex-column h-100">
    <template v-if="commonTaskList.length">
      <div class="common-task-list">
        <CommonTaskCard
          v-for="commonTask of commonTaskList"
          :key="commonTask.id"
          :common-task="commonTask"
          :selected="isCommonTaskSelected(commonTask.id)"
          :class="{ 'cursor-pointer': !isCommonTaskSelected(commonTask.id) }"
          :editable="false"
          @click.native="selectCommonTask(commonTask.id)" />
      </div>
    </template>
    <template v-else>
      <EmptyListDisplay message="You didn't create any common task yet." class="empty-list-display">
        <template #img>
          <img
            src="../../../../../../assets/no_common_task.svg"
            alt="No common task"
            class="empty-list-display__img" />
        </template>
      </EmptyListDisplay>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.common-task-list {
  display: grid;
  // Max 2 column
  grid-template-columns: repeat(auto-fit, minmax(max(300px, calc((100% - 8px) / 2)), 1fr));
  gap: 8px;

  @media #{map.get(variables.$display-breakpoints, 'xs')} {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  & > * {
    min-width: 0;
  }
}

.empty-list-display {
  flex-grow: 1;

  &__img {
    width: clamp(200px, 50%, 300px);
  }
}
</style>
