<script setup lang="ts">
import { DailyTask } from '@/models/daily-task.model'
import CollectionChip from '@/components/CollectionChip.vue'
import SectionChip from '@/components/SectionChip.vue'
import ProjectChip from '@/components/ProjectChip.vue'
import TagGroup from '@/views/components/tag/TagGroup.vue'
import DailyTaskActionChip from '@/views/daily/components/DailyTaskActionChip.vue'
import { computed } from 'vue'

const props = defineProps<{
  dailyTask: DailyTask
}>()

defineEmits<{
  toggle: []
}>()

const name = computed<string>(() => {
  if (props.dailyTask.task) return props.dailyTask.task.name
  else if (props.dailyTask.commonTask) return props.dailyTask.commonTask.name
  else return props.dailyTask.name as string // We know name is defined
})
</script>

<template>
  <v-card
    :color="dailyTask.completed ? 'green darken-2' : null"
    class="daily-task-card rounded-lg pa-3 pa-sm-4"
    @click="$emit('toggle')">
    <div class="daily-task-card__header">
      <div class="flex-grow-1 d-flex align-center gap-2">
        <DailyTaskActionChip
          v-if="dailyTask.action"
          :action="dailyTask.action"
          class="daily-task-card__header__action">
        </DailyTaskActionChip>

        <h4 class="flex-grow-1 text-body-2 text-sm-body-1 font-weight-medium">
          {{ name }}
        </h4>
      </div>

      <template v-if="dailyTask.task">
        <template v-if="dailyTask.task.project">
          <ProjectChip
            v-if="dailyTask.task.project"
            :project="dailyTask.task.project"
            small
            class="daily-task-card__header__link"
            @click.native.stop>
          </ProjectChip>
        </template>
        <template v-if="dailyTask.task.section">
          <SectionChip
            v-if="dailyTask.task.section"
            :section="dailyTask.task.section"
            small
            class="daily-task-card__header__link"
            @click.native.stop>
          </SectionChip>
        </template>
        <template v-if="dailyTask.task.collection">
          <CollectionChip
            v-if="dailyTask.task.collection"
            :collection="dailyTask.task.collection"
            small
            class="daily-task-card__header__link"
            @click.native.stop>
          </CollectionChip>
        </template>
      </template>
    </div>

    <template v-if="dailyTask.task && dailyTask.task.tags.length > 0">
      <TagGroup :tag-list="dailyTask.task.tags" z-index="300" />
    </template>

    <template v-if="dailyTask.commonTask && dailyTask.commonTask.tags.length > 0">
      <TagGroup :tag-list="dailyTask.commonTask.tags" z-index="300" />
    </template>

    <template v-if="dailyTask.tags.length > 0">
      <TagGroup :tag-list="dailyTask.tags" z-index="300" />
    </template>
  </v-card>
</template>

<style scoped lang="scss">
.daily-task-card {
  display: flex;
  flex-direction: column;
  row-gap: 8px;

  &::after {
    left: -9px !important;
  }

  &__header {
    display: flex;
    flex-wrap: wrap-reverse;
    align-items: center;
    gap: 8px;

    &__action {
      flex-shrink: 0;
      align-self: flex-start;
    }

    &__link {
      flex-shrink: 1;
      max-width: 12rem;
    }
  }
}
</style>
