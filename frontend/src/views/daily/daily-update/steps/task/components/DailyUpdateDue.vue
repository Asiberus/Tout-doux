<script setup lang="ts">
import CollectionChip from '@/components/CollectionChip.vue'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import ProjectChip from '@/components/ProjectChip.vue'
import SectionChip from '@/components/SectionChip.vue'
import { useToday } from '@/composables/useToday'
import { dateFormat } from '@/pipes'
import { DailyUpdateTaskTab } from '@/models/daily-task.model'
import { DueEntry, DueGroups } from '@/utils/daily-due.utils'
import { DUE_SOON_DAYS, DueDateShortcut, dueDateShortcuts } from '@/utils/due-date.utils'
import TaskCard from '@/views/components/task/TaskCard.vue'
import { computed } from 'vue'

const props = defineProps<{
  groups: DueGroups
  date: string
}>()

const emit = defineEmits<{
  'select-task': [data: { taskId: number }]
  select: [event: { tab: DailyUpdateTaskTab; id: number; sectionId?: number }]
  reschedule: [event: { taskId: number; dueDate: string | null }]
  'plan-tasks': [taskIds: number[]]
}>()

const { today } = useToday()

const shortcuts = computed<DueDateShortcut[]>(() =>
  dueDateShortcuts(today.value.format('YYYY-MM-DD'))
)

const isToday = computed<boolean>(() => today.value.isSame(props.date, 'day'))

const dueSoonHint = computed<string>(() =>
  isToday.value
    ? `Due in the next ${DUE_SOON_DAYS} days`
    : `Due in the ${DUE_SOON_DAYS} days after ${dateFormat(props.date, 'dddd D MMMM')}`
)

const dueTodayHint = computed<string | undefined>(() =>
  isToday.value
    ? undefined
    : `Due on ${dateFormat(props.date, 'dddd D MMMM')}, the day being planned`
)

const sections = computed<
  { key: string; icon: string; title: string; hint?: string; entries: DueEntry[] }[]
>(() =>
  [
    {
      key: 'today',
      icon: 'mdi-calendar-today',
      title: isToday.value ? 'Today' : 'This day',
      hint: dueTodayHint.value,
      entries: props.groups.today,
    },
    { key: 'overdue', icon: 'mdi-calendar-alert', title: 'Late', entries: props.groups.overdue },
    {
      key: 'soon',
      icon: 'mdi-calendar',
      title: 'Soon',
      hint: dueSoonHint.value,
      entries: props.groups.soon,
    },
  ].filter(({ entries }) => entries.length > 0)
)

function select(entry: DueEntry): void {
  if (entry.planned) return

  emit('select-task', { taskId: entry.task.id })
}

function otherShortcuts(entry: DueEntry): DueDateShortcut[] {
  return shortcuts.value.filter(({ value }) => value !== entry.task.dueDate)
}

function unplannedIds(entries: DueEntry[]): number[] {
  return entries.filter(({ planned }) => !planned).map(({ task }) => task.id)
}

function reschedule(taskId: number, dueDate: string | null): void {
  emit('reschedule', { taskId, dueDate })
}

function selectContainer(tab: DailyUpdateTaskTab, id: number, sectionId?: number): void {
  emit('select', { tab, id, sectionId })
}
</script>

<template>
  <div v-if="sections.length" class="d-flex flex-column gap-4">
    <section v-for="section of sections" :key="section.key">
      <div class="d-flex align-center gap-2" :class="section.hint ? 'mb-1' : 'mb-2'">
        <v-icon :icon="section.icon" size="small" :class="`due-section-icon--${section.key}`" />
        <h6 class="text-title-medium">{{ section.title }}</h6>
        <v-chip size="small" class="due-counter">
          {{ section.entries.length }}
        </v-chip>
        <v-btn
          v-if="section.key === 'today' && unplannedIds(section.entries).length > 0"
          color="accent"
          variant="tonal"
          size="small"
          rounded
          prepend-icon="mdi-calendar-plus"
          class="ms-auto"
          @click="emit('plan-tasks', unplannedIds(section.entries))">
          plan tasks
        </v-btn>
      </div>
      <p v-if="section.hint" class="text-body-small text-grey mb-2">{{ section.hint }}</p>
      <div class="due-wrapper">
        <TaskCard
          v-for="entry of section.entries"
          :key="`due-task-${entry.task.id}`"
          :task="entry.task"
          :selected="entry.planned"
          :class="{ 'cursor-pointer': !entry.planned }"
          small
          :completable="false"
          :show-completed-at="false"
          :display-options="false"
          :reference-day="date"
          @click="select(entry)">
          <template #actions>
            <v-menu>
              <template #activator="{ props: menuProps }">
                <v-btn
                  v-bind="menuProps"
                  icon
                  variant="text"
                  size="small"
                  density="comfortable"
                  title="Change the due date"
                  class="due-actions"
                  @click.stop>
                  <v-icon icon="mdi-dots-vertical" />
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-subheader>Move the due date to</v-list-subheader>
                <v-list-item
                  v-for="shortcut of otherShortcuts(entry)"
                  :key="shortcut.label"
                  @click="reschedule(entry.task.id, shortcut.value)">
                  <v-list-item-title>
                    {{ shortcut.label }}
                    <span v-if="shortcut.detail" class="text-grey">· {{ shortcut.detail }}</span>
                  </v-list-item-title>
                </v-list-item>
                <v-divider class="my-1" />
                <v-list-item @click="reschedule(entry.task.id, null)">
                  <v-list-item-title class="d-flex align-center">
                    <v-icon icon="mdi-calendar-remove" size="small" start />
                    Remove due date
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
          <template #meta>
            <ProjectChip
              v-if="entry.container.project"
              :project="entry.container.project"
              small
              :navigate-to-detail="false"
              class="due-chip"
              @click="selectContainer(DailyUpdateTaskTab.Project, entry.container.project.id)" />
            <SectionChip
              v-else-if="entry.container.section"
              :section="entry.container.section"
              small
              :navigate-to-detail="false"
              class="due-chip"
              @click="
                selectContainer(
                  DailyUpdateTaskTab.Project,
                  entry.container.section.project.id,
                  entry.container.section.id
                )
              " />
            <CollectionChip
              v-else-if="entry.container.collection"
              :collection="entry.container.collection"
              small
              :navigate-to-detail="false"
              class="due-chip"
              @click="
                selectContainer(DailyUpdateTaskTab.Collection, entry.container.collection.id)
              " />
          </template>
        </TaskCard>
      </div>
    </section>
  </div>

  <EmptyListDisplay v-else message="Nothing due" class="empty-list-display">
    <template #img>
      <img
        src="../../../../../../assets/all_task_completed.svg"
        alt="Nothing due"
        class="empty-list-display__img" />
    </template>
  </EmptyListDisplay>
</template>

<style scoped lang="scss">
.due-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// Une tâche planifiée est une `TaskCard` désactivée : Vuetify lui retire les clics, que le chip
// et le menu doivent garder.
.due-chip,
.due-actions {
  pointer-events: auto;
}

.due-chip {
  flex: 1 1 8rem;
  max-width: max-content;
}

.due-section-icon {
  &--overdue {
    color: #ff8a80;
  }

  &--today {
    color: #ffb74d;
  }

  &--soon {
    color: #ffe082;
  }
}

.empty-list-display {
  height: 100%;

  &__img {
    width: clamp(200px, 50%, 300px);
  }
}
</style>
