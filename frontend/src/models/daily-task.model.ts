import { TaskExtended } from '@/models/task.model'

// Todo : add get literal in enum
export enum DailyTaskActionEnum {
    THINK = 'TH',
    WORK = 'WO',
    FINISH = 'FI',
}

export interface DailyTask {
    id: number
    date: string
    completed: boolean
    action?: DailyTaskActionEnum
    taskId?: number
    task?: TaskExtended
    name?: string
}

export interface DailyTaskDisplay extends DailyTask {
    editMode: boolean
}

// Todo : Change Name
export interface DailyTaskDisplayWrapper<T> {
    content: T
    selected: boolean
}

export enum DailyUpdateTaskTab {
    Project,
    Collection,
}
