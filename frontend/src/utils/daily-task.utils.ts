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
            return 'teal'
        case DailyTaskActionEnum.WORK:
            return 'purple'
        case DailyTaskActionEnum.FINISH:
            return 'red'
    }
}
