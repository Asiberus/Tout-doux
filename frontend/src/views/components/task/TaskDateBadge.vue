<script setup lang="ts">
import { useToday } from '@/composables/useToday'
import { dateFormat } from '@/pipes'
import {
  DateBadgeKind,
  completionDelayLabel,
  DueDateStatus,
  dateLabel,
  dueDateStatus,
} from '@/utils/due-date.utils'
import moment from 'moment'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    date: string
    referenceDay: string
    kind?: DateBadgeKind
    dueDate?: string | null
  }>(),
  { kind: 'due', dueDate: null }
)

const { today } = useToday()

type BadgeStatus = DueDateStatus | 'completed'

const ICONS: Record<Exclude<BadgeStatus, 'none'>, string> = {
  overdue: 'mdi-calendar-alert',
  today: 'mdi-calendar-today',
  soon: 'mdi-calendar',
  later: 'mdi-calendar',
  completed: 'mdi-calendar-check',
}

const day = computed<string>(() => moment(props.date).format('YYYY-MM-DD'))
const status = computed<BadgeStatus>(() =>
  props.kind === 'completed'
    ? 'completed'
    : dueDateStatus({ completed: false, dueDate: day.value }, props.referenceDay)
)
const delay = computed<string | null>(() =>
  props.kind === 'completed' ? completionDelayLabel(day.value, props.dueDate) : null
)
const title = computed<string>(
  () =>
    `${props.kind === 'completed' ? 'Completed' : 'Due'} on ${dateFormat(props.date, 'D MMMM Y')}${
      delay.value ? `, ${delay.value}` : ''
    }`
)
</script>

<template>
  <span v-if="status !== 'none'" class="date-badge" :class="`date-badge--${status}`" :title="title">
    <v-icon :icon="ICONS[status]" size="small" />
    {{ dateLabel(day, referenceDay, today.format('YYYY-MM-DD'), kind) }}
    <template v-if="delay">· {{ delay }}</template>
  </span>
</template>

<style scoped lang="scss">
.date-badge {
  display: inline-flex;
  align-items: center;
  column-gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  line-height: 1.125rem;
  letter-spacing: normal;
  background-color: rgba(0, 0, 0, 0.32);
  white-space: nowrap;

  // Facteur que `v-chip` `small` applique à ses icônes : même rendu que le ProjectChip voisin
  .v-icon {
    --v-icon-size-multiplier: 0.8571428571;
  }

  &--overdue {
    color: #ff8a80;
  }

  &--today {
    color: #ffb74d;
  }

  &--soon {
    color: #ffe082;
  }

  &--later,
  &--completed {
    color: rgba(255, 255, 255, 0.87);
  }
}
</style>
