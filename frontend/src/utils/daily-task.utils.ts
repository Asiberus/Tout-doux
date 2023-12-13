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
    }
}

export function getActionChipColor(action: DailyTaskAction): string {
    switch (action) {
        case DailyTaskAction.THINK:
            return 'teal lighten-3'
        case DailyTaskAction.WORK:
            return 'purple lighten-3'
        case DailyTaskAction.FINISH:
            return 'red lighten-3'
    }
}

export function getActionChipTextColor(action: DailyTaskAction): string {
    switch (action) {
        case DailyTaskAction.THINK:
            return 'teal--text text--darken-3'
        case DailyTaskAction.WORK:
            return 'purple--text text--darken-3'
        case DailyTaskAction.FINISH:
            return 'red--text text--darken-3'
    }
}

export const actionOptions: { value: DailyTaskAction | null; text: string }[] = [
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
