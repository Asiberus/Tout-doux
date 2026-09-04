<script setup lang="ts">
import { CommonTask, CommonTaskForm } from '@/models/common-task.model'
import CommonTaskCard from '@/views/components/common-task/CommonTaskCard.vue'
import CommonTaskDialog from '@/views/components/common-task/CommonTaskDialog.vue'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { DailyTask } from '@/models/daily-task.model'
import { ref } from 'vue'

const props = defineProps<{
  commonTaskList: CommonTask[]
  dailyTaskList: DailyTask[]
}>()

const emit = defineEmits<{
  'select-common-task': [data: { commonTaskId: number }]
  'create-common-task': [data: CommonTaskForm]
}>()

const commonTaskDialog = ref(false)

function selectCommonTask(id: number): void {
  if (isCommonTaskSelected(id)) return

  emit('select-common-task', { commonTaskId: id })
}

function createCommonTask(data: CommonTaskForm): void {
  commonTaskDialog.value = false
  emit('create-common-task', data)
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
          @click="selectCommonTask(commonTask.id)" />

        <v-card variant="outlined" ripple class="create-task-card" @click="commonTaskDialog = true">
          <v-card-text class="d-flex align-center justify-center gap-2">
            <v-icon icon="mdi-plus" />
            <span class="text-body-medium text-sm-body-large font-weight-medium">
              Create a common task
            </span>
          </v-card-text>
        </v-card>
      </div>

      <CommonTaskDialog v-model="commonTaskDialog" @create="createCommonTask($event)" />
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
@use 'vuetify/lib/styles/settings/colors';
@use '@/styles/breakpoints' as variables;

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

.create-task-card {
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-style: dashed;
  color: map.get(colors.$grey, 'darken-4');
  transition: color 0.2s ease-in-out;

  @media (hover: hover) {
    &:hover {
      color: map.get(colors.$grey, 'darken-1');
    }
  }
}
</style>
