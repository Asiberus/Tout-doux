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
  caret?: boolean
}>()

defineEmits<{
  toggle: []
}>()

const name = computed<string>(() => {
  if (props.dailyTask.task) return props.dailyTask.task.name
  else if (props.dailyTask.commonTask) return props.dailyTask.commonTask.name
  else return props.dailyTask.name as string // We know name is defined
})

const cardColor = computed(() => (props.dailyTask.completed ? 'green-darken-2' : 'surface'))
</script>

<template>
  <v-card
    :color="cardColor"
    class="daily-task-card rounded-lg pa-3 pa-sm-4"
    :ripple="false"
    :class="{ caret }"
    @click="$emit('toggle')">
    <div class="daily-task-card__header">
      <div class="flex-grow-1 d-flex align-center gap-2">
        <DailyTaskActionChip
          v-if="dailyTask.action"
          :action="dailyTask.action"
          class="daily-task-card__header__action">
        </DailyTaskActionChip>

        <h4 class="flex-grow-1 text-body-medium text-sm-body-large font-weight-medium">
          {{ name }}
        </h4>
      </div>

      <template v-if="dailyTask.task">
        <template v-if="dailyTask.task.project">
          <ProjectChip
            v-if="dailyTask.task.project"
            :project="dailyTask.task.project"
            small
            class="daily-task-card__header__link">
          </ProjectChip>
        </template>
        <template v-if="dailyTask.task.section">
          <SectionChip
            v-if="dailyTask.task.section"
            :section="dailyTask.task.section"
            small
            class="daily-task-card__header__link">
          </SectionChip>
        </template>
        <template v-if="dailyTask.task.collection">
          <CollectionChip
            v-if="dailyTask.task.collection"
            :collection="dailyTask.task.collection"
            small
            class="daily-task-card__header__link">
          </CollectionChip>
        </template>
      </template>
    </div>

    <template v-if="dailyTask.task && dailyTask.task.tags.length > 0">
      <TagGroup :tag-list="dailyTask.task.tags" :z-index="300" />
    </template>

    <template v-if="dailyTask.commonTask && dailyTask.commonTask.tags.length > 0">
      <TagGroup :tag-list="dailyTask.commonTask.tags" :z-index="300" />
    </template>

    <template v-if="dailyTask.tags.length > 0">
      <TagGroup :tag-list="dailyTask.tags" :z-index="300" />
    </template>
  </v-card>
</template>

<style scoped lang="scss">
.daily-task-card {
  display: flex;
  flex-direction: column;
  row-gap: 8px;

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

.v-card.caret {
  overflow: visible;
}

.caret::after {
  content: '';
  position: absolute;
  top: 50%;
  left: -5px;
  width: 14px;
  height: 14px;
  background-color: inherit;
  transform: translateY(-50%) rotate(45deg);
}
</style>
