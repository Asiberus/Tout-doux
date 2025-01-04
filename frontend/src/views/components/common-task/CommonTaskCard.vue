<script setup lang="ts">
import { CommonTask, CommonTaskForm } from '@/models/common-task.model'
import CommonTaskDialog from '@/views/components/common-task/CommonTaskDialog.vue'
import TagGroup from '@/views/components/tag/TagGroup.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { ref } from 'vue'

const {
  commonTask,
  editable = true,
  selected = false,
} = defineProps<{
  commonTask: CommonTask
  editable?: boolean
  selected?: boolean
}>()

const emit = defineEmits<{
  update: [event: { id: number; data: CommonTaskForm }]
  delete: [id: number]
}>()

const commonTaskMenu = ref(false)
const editDialog = ref(false)
const deleteConfirmDialog = ref(false)

function openEditDialog(): void {
  editDialog.value = true
}

function openDeleteDialog(): void {
  deleteConfirmDialog.value = true
}

function emitUpdateEvent(event: { id: number; data: CommonTaskForm }): void {
  editDialog.value = false
  emit('update', event)
}

function emitDeleteEvent(): void {
  editDialog.value = false
  emit('delete', commonTask.id)
}
</script>

<template>
  <div>
    <v-card
      :color="selected ? 'green darken-2' : null"
      :disabled="selected"
      :ripple="false"
      class="wrapper rounded-lg">
      <v-icon>mdi-timeline</v-icon>
      <div class="content">
        <h5 class="content__title text-body-1 text-sm-h6 text-white" :title="commonTask.name">
          {{ commonTask.name }}
        </h5>
        <template v-if="commonTask.tags.length > 0">
          <TagGroup :tag-list="commonTask.tags" max-tag="3"></TagGroup>
        </template>
      </div>
      <div v-if="editable" class="actions">
        <v-menu v-model="commonTaskMenu" offset-y>
          <template #activator="{ props }">
            <v-btn variant="plain" icon size="x-small" v-bind="props">
              <v-icon size="small">mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="openEditDialog()">
              <v-icon size="small" start>mdi-pencil</v-icon>
              <v-list-item-title>Edit</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openDeleteDialog()">
              <v-icon size="small" start>mdi-trash-can</v-icon>
              <v-list-item-title>Delete</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-card>

    <CommonTaskDialog
      v-model="editDialog"
      :common-task="commonTask"
      @update="emitUpdateEvent($event)">
    </CommonTaskDialog>

    <ConfirmDialog v-model="deleteConfirmDialog" @confirm="emitDeleteEvent()">
      <template #icon>
        <v-icon size="x-large">mdi-trash-can</v-icon>
      </template>
      <span>Are you sure to delete this common task ?</span>
    </ConfirmDialog>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.wrapper {
  display: flex;
  align-items: center;
  column-gap: 8px;
  padding: 12px 20px 12px 12px;
  min-height: 80px;
  height: 100%;

  .content {
    flex-grow: 1;
    min-width: 0; // default to min-width: auto for flex children. Prevent content to overflowing
    display: flex;
    flex-direction: column;
    row-gap: 4px;

    &__title {
      line-height: 1.25rem;
    }

    .tag-icon {
      opacity: 0.62;
      margin-right: 4px;
    }
  }

  .actions {
    position: absolute;
    top: 8px;
    right: 4px;
  }
}

@media #{map.get(variables.$display-breakpoints, 'sm-and-up')} {
  .wrapper {
    padding: 12px 24px 12px 20px;
    column-gap: 16px;

    .content__title {
      line-height: 1.5rem;
    }

    .actions {
      right: 8px;
    }
  }
}
</style>
