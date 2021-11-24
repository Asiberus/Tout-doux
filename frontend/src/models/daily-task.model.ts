import { TaskModel } from '@/models/task.model'

// Todo : add get literal in enum
export enum DailyTaskActionEnum {
    THINK = 'TH',
    WORK = 'WO',
    FINISH = 'FI',
}

export interface DailyTaskModel {
    id: number
    date: string
    taskId?: number
    name?: string
    action?: DailyTaskActionEnum
    completed: boolean
    task: TaskModel
}

export interface DailyTaskDisplayModel extends DailyTaskModel {
    editMode: boolean
}

// Todo : Change Name
export interface DailyTaskDisplayWrapper<T> {
    content: T
    selected: boolean
}
