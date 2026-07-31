import { DailyTaskAction } from '@/models/daily-task.model'

// Todo : define color for dailytask action chip
export function getLiteralFormOfDailyActionEnum(action: DailyTaskAction): string {
  switch (action) {
    case DailyTaskAction.THINK:
      return 'Think'
    case DailyTaskAction.WORK:
      return 'Work'
    case DailyTaskAction.FINISH:
      return 'Finish'
    default:
      throw 'Unknown action'
  }
}

export function getActionChipColor(action: DailyTaskAction | null): string {
  switch (action) {
    case DailyTaskAction.THINK:
      return 'teal-lighten-3'
    case DailyTaskAction.WORK:
      return 'purple-lighten-3'
    case DailyTaskAction.FINISH:
      return 'red-lighten-3'
    default:
      return 'grey-darken-3'
  }
}

export function getActionChipTextColor(action: DailyTaskAction | null): string {
  switch (action) {
    case DailyTaskAction.THINK:
      return 'text-teal-darken-3'
    case DailyTaskAction.WORK:
      return 'text-purple-darken-3'
    case DailyTaskAction.FINISH:
      return 'text-red-darken-3'
    default:
      return 'text-grey-lighten-3'
  }
}

export const DailyActionOptions: { value: DailyTaskAction | null; text: string }[] = [
  { value: null, text: 'No action' },
  {
    value: DailyTaskAction.THINK,
    text: getLiteralFormOfDailyActionEnum(DailyTaskAction.THINK),
  },
  {
    value: DailyTaskAction.WORK,
    text: getLiteralFormOfDailyActionEnum(DailyTaskAction.WORK),
  },
  {
    value: DailyTaskAction.FINISH,
    text: getLiteralFormOfDailyActionEnum(DailyTaskAction.FINISH),
  },
]
