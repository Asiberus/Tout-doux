<script setup lang="ts">
import { commonTaskApi } from '@/api'
import { CommonTask, CommonTaskForm } from '@/models/common-task.model'
import CommonTaskCard from '@/views/components/common-task/CommonTaskCard.vue'
import CommonTaskDialog from '@/views/components/common-task/CommonTaskDialog.vue'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import TertiaryTitle from '@/components/TertiaryTitle.vue'
import { onBeforeMount, ref } from 'vue'

onBeforeMount(() => {
  fetchCommonTaskList()
})

const commonTaskList = ref<CommonTask[]>([])
const commonTaskDialog = ref(false)

function fetchCommonTaskList(): void {
  commonTaskApi
    .getCommonTaskList({ size: 0 })
    .then(response => (commonTaskList.value = response.content))
    .catch(error => console.error(error))
}

function createCommonTask(data: CommonTaskForm): void {
  commonTaskApi
    .createCommonTask(data)
    .then(response => {
      commonTaskList.value.push(response)
      commonTaskDialog.value = false
    })
    .catch(error => console.error(error))
}

function updateCommonTask({ id, data }: { id: number; data: CommonTaskForm }): void {
  commonTaskApi
    .updateCommonTask(id, data)
    .then(response => {
      const index = commonTaskList.value.findIndex(commonTask => commonTask.id === id)
      if (index !== -1) commonTaskList.value.splice(index, 1, response)
    })
    .catch(error => console.error(error))
}

function deleteCommonTask(id: number): void {
  commonTaskApi
    .deleteCommonTask(id)
    .then(() => {
      const index = commonTaskList.value.findIndex(commonTask => commonTask.id === id)
      if (index !== -1) commonTaskList.value.splice(index, 1)
    })
    .catch(error => console.error(error))
}
</script>

<template>
  <div class="fill-height d-flex flex-column">
    <TertiaryTitle>Common task</TertiaryTitle>

    <div class="d-flex flex-wrap flex-md-nowrap justify-end align-center gap-2 mb-2">
      <h3 class="flex-grow-1 text-subtitle-2 text-sm-subtitle-1 mr-md-5">
        A common task represent a task that can be done frequently (e.g. take the dog out, buy some
        groceries). It can easily be added in the daily update.
      </h3>

      <CommonTaskDialog v-model="commonTaskDialog" @create="createCommonTask($event)">
        <template #activator="{ attrs, on }">
          <v-btn v-bind="attrs" v-on="on">
            <v-icon start>mdi-plus</v-icon>
            common task
          </v-btn>
        </template>
      </CommonTaskDialog>
    </div>

    <template v-if="commonTaskList.length">
      <div class="common-task-wrapper">
        <CommonTaskCard
          v-for="commonTask of commonTaskList"
          :key="commonTask.id"
          :common-task
          @update="updateCommonTask($event)"
          @delete="deleteCommonTask($event)" />
      </div>
    </template>
    <template v-else>
      <EmptyListDisplay
        message="You didn't create any common task yet."
        class="empty-list-displays">
        <template #img>
          <img
            src="../../../assets/no_common_task.svg"
            alt="No common task"
            class="empty-list-display__img" />
        </template>
      </EmptyListDisplay>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.common-task-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(296px, 1fr));
  gap: 8px;

  @media #{map.get(variables.$display-breakpoints, 'sm-and-up')} {
    grid-template-columns: repeat(auto-fill, minmax(max(300px, calc((100% - 12px) / 2)), 1fr));
    gap: 12px;
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
