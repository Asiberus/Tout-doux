import moment, { Moment } from 'moment'
import { Task } from '@/models/task.model'

export const DUE_SOON_DAYS = 5

export type DateBadgeKind = 'due' | 'completed'

export type DueDateStatus = 'overdue' | 'today' | 'soon' | 'later' | 'none'

export interface DueDateShortcut {
  label: string
  value: string
  detail?: string
}

const DATE_FORMAT = 'YYYY-MM-DD'

export function daysUntil(dueDate: string, referenceDay: string): number {
  return moment(dueDate, DATE_FORMAT).diff(moment(referenceDay, DATE_FORMAT), 'days')
}

export function dueDateStatus(
  task: Pick<Task, 'completed' | 'dueDate'>,
  referenceDay: string
): DueDateStatus {
  if (task.completed || !task.dueDate) return 'none'

  const days = daysUntil(task.dueDate, referenceDay)
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= DUE_SOON_DAYS) return 'soon'
  return 'later'
}

export function dateLabel(
  date: string,
  referenceDay: string,
  today: string,
  kind: DateBadgeKind = 'due'
): string {
  const days = daysUntil(date, referenceDay)
  const fullDate = moment(date, DATE_FORMAT).format('D MMMM Y')
  if (referenceDay !== today) return days === 0 ? 'This day' : fullDate
  if (Math.abs(days) > DUE_SOON_DAYS) return fullDate
  if (days < 0) return pastLabel(-days, kind)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `Next ${moment(date, DATE_FORMAT).format('dddd')}`
}

function pastLabel(days: number, kind: DateBadgeKind): string {
  if (kind === 'due') return days === 1 ? '1 day late' : `${days} days late`
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

export function completionDelayLabel(completedDay: string, dueDate: string | null): string | null {
  if (!dueDate) return null
  const days = daysUntil(completedDay, dueDate)
  return days > 0 ? pastLabel(days, 'due') : null
}

export function dueDateShortcuts(today: string): DueDateShortcut[] {
  const day = moment(today, DATE_FORMAT)
  const withDetail = (label: string, date: Moment): DueDateShortcut => ({
    label,
    value: date.format(DATE_FORMAT),
    detail: date.format('D MMM'),
  })
  const shortcuts: DueDateShortcut[] = [
    { label: 'Today', value: day.format(DATE_FORMAT) },
    { label: 'Tomorrow', value: day.clone().add(1, 'day').format(DATE_FORMAT) },
    ...(day.isoWeekday() < 5 ? [withDetail('Next Friday', day.clone().isoWeekday(5))] : []),
    withDetail('Next week', day.clone().isoWeekday(8)),
    withDetail('End of month', day.clone().endOf('month')),
  ]

  return shortcuts.filter(
    (shortcut, index) => shortcuts.findIndex(({ value }) => value === shortcut.value) === index
  )
}

export function dueDateChangeMessage(dueDate: string | null): string {
  if (!dueDate) return 'Due date removed'
  return `Due date moved to ${moment(dueDate, DATE_FORMAT).format('dddd D MMMM')}`
}
