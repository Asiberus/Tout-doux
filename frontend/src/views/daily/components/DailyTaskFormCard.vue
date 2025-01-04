<script setup lang="ts">
import { DailyTask, DailyTaskPatch, DailyUpdateTaskTab } from '@/models/daily-task.model'
import CollectionChip from '@/components/CollectionChip.vue'
import SectionChip from '@/components/SectionChip.vue'
import ProjectChip from '@/components/ProjectChip.vue'
import TagGroup from '@/views/components/tag/TagGroup.vue'
import DailyTaskActionChip from '@/views/daily/components/DailyTaskActionChip.vue'
import DailyTaskForm from '@/views/daily/components/DailyTaskForm.vue'
import { computed } from 'vue'

const props = defineProps<{
  dailyTask: DailyTask
  editMode: boolean
}>()

const emit = defineEmits<{
  'show-edit-mode': []
  'hide-edit-mode': []
  update: [data: DailyTaskPatch]
  delete: []
  select: [data: { tab: DailyUpdateTaskTab; id: number; sectionId?: number }]
}>()

const name = computed<string>(() => {
  if (props.dailyTask.task) return props.dailyTask.task.name
  else if (props.dailyTask.commonTask) return props.dailyTask.commonTask.name
  else return props.dailyTask.name as string // We know name is defined
})

function showEditMode(): void {
  emit('show-edit-mode')
}

function hideEditMode(): void {
  emit('hide-edit-mode')
}

function updateDailyTask(data: DailyTaskPatch): void {
  emit('update', data)
}

function deleteDailyTask(): void {
  emit('delete')
}

function select(tab: DailyUpdateTaskTab, id: number, sectionId?: number): void {
  emit('select', { tab, id, sectionId })
}
</script>

<template>
  <v-card class="daily-task-form-card rounded-lg">
    <template v-if="!editMode && dailyTask">
      <div class="daily-task-form-card__content">
        <div class="daily-task-form-card__actions">
          <v-menu offset-y>
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                size="small"
                variant="plain"
                color="white"
                class="daily-task-form-card__actions__btn">
                <v-icon size="small">mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item v-if="!dailyTask.task && !dailyTask.commonTask" @click="showEditMode()">
                <v-icon size="small" start color="accent">mdi-pencil</v-icon>
                <v-list-item-title>Edit</v-list-item-title>
              </v-list-item>
              <v-list-item @click="deleteDailyTask()">
                <v-icon size="small" start color="error">mdi-trash-can</v-icon>
                <v-list-item-title>Delete</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <div class="daily-task-form-card__content__header">
          <DailyTaskActionChip
            v-model:action="dailyTask.action"
            :editable="true"
            class="flex-shrink-0"
            @update="updateDailyTask({ action: $event })">
          </DailyTaskActionChip>

          <h4 class="text-body-2 text-sm-body-1 font-weight-medium" :title="name">
            {{ name }}
          </h4>
        </div>
        <template
          v-if="
            dailyTask.task ||
            (dailyTask.commonTask && dailyTask.commonTask.tags.length > 0) ||
            dailyTask.tags.length > 0
          ">
          <div class="daily-task-form-card__content__footer">
            <template v-if="dailyTask.task">
              <ProjectChip
                v-if="dailyTask.task.project"
                :project="dailyTask.task.project"
                :small="true"
                :navigate-to-detail="false"
                class="daily-task-form-card__content__footer__chip"
                @click="select(DailyUpdateTaskTab.Project, dailyTask.task.project.id)" />
              <SectionChip
                v-if="dailyTask.task.section"
                :section="dailyTask.task.section"
                :small="true"
                :navigate-to-detail="false"
                class="daily-task-form-card__content__footer__chip"
                @click="
                  select(
                    DailyUpdateTaskTab.Project,
                    dailyTask.task.section.project.id,
                    dailyTask.task.section.id
                  )
                " />
              <CollectionChip
                v-if="dailyTask.task.collection"
                :collection="dailyTask.task.collection"
                :small="true"
                :navigate-to-detail="false"
                class="daily-task-form-card__content__footer__chip"
                @click="select(DailyUpdateTaskTab.Collection, dailyTask.task.collection.id)" />
            </template>

            <template v-if="dailyTask.tags.length > 0">
              <TagGroup :tag-list="dailyTask.tags" :max-tag="2" />
            </template>
            <template v-if="dailyTask.task && dailyTask.task.tags.length > 0">
              <TagGroup :tag-list="dailyTask.task.tags" :max-tag="2" />
            </template>
            <template v-if="dailyTask.commonTask && dailyTask.commonTask.tags.length > 0">
              <TagGroup :tag-list="dailyTask.commonTask.tags" :max-tag="2" />
            </template>
          </div>
        </template>
      </div>
    </template>

    <template v-else>
      <DailyTaskForm
        :daily-task="dailyTask"
        class="flex-grow-1"
        @submit="updateDailyTask($event)"
        @close="hideEditMode()" />
    </template>
  </v-card>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.daily-task-form-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px 12px 12px;

  &__actions {
    position: absolute;
    top: 4px;
    right: 4px;
    display: flex;
    align-items: center;
    column-gap: 8px;

    &__btn {
      min-width: 0 !important;
      padding: 0 !important;
    }
  }

  &__content {
    flex-grow: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    row-gap: 8px;

    &__header {
      display: flex;
      align-items: baseline;
      column-gap: 8px;
    }

    &__footer {
      display: flex;
      align-items: center;
      column-gap: 8px;

      &__chip {
        flex-shrink: 1;
        max-width: 10rem;
        cursor: pointer;
      }
    }
  }
}

@media #{map.get(variables.$display-breakpoints, 'sm-and-up')} {
  .daily-task-form-card {
    padding: 16px 24px 16px 16px;

    &__actions {
      right: 8px;
    }
  }
}
</style>
