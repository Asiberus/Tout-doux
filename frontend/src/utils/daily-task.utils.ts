import { DailyTaskActionEnum } from '@/models/daily-task.model'

// Todo : define color for dailytask action chip
export function getLiteralFormOfDailyActionEnum(action: DailyTaskActionEnum): string {
    switch (action) {
        case DailyTaskActionEnum.THINK:
            return 'Réfléchir'
        case DailyTaskActionEnum.WORK:
            return 'Travailler'
        case DailyTaskActionEnum.FINISH:
            return 'Finir'
    }
}

export function getActionChipColor(action: DailyTaskActionEnum): string {
    switch (action) {
        case DailyTaskActionEnum.THINK:
            return 'teal lighten-3'
        case DailyTaskActionEnum.WORK:
            return 'purple lighten-3'
        case DailyTaskActionEnum.FINISH:
            return 'red lighten-3'
    }
}

export function getActionChipTextColor(action: DailyTaskActionEnum): string {
    switch (action) {
        case DailyTaskActionEnum.THINK:
            return 'teal--text text--darken-3'
        case DailyTaskActionEnum.WORK:
            return 'purple--text text--darken-3'
        case DailyTaskActionEnum.FINISH:
            return 'red--text text--darken-3'
    }
}
