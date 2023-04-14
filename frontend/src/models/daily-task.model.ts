import { TaskExtended } from '@/models/task.model'
import { CommonTask } from '@/models/common-task.model'
import { Tag } from '@/models/tag.model'

// Todo : add get literal in enum
export enum DailyTaskActionEnum {
    THINK = 'TH',
    WORK = 'WO',
    FINISH = 'FI',
}

export interface DailyTaskPost {
    name?: string
    tagIds?: number[]
    taskId?: number
    commonTaskId?: number
    action?: DailyTaskActionEnum
}

export interface DailyTaskPatch {
    name?: string
    tagIds?: number[]
    action?: DailyTaskActionEnum
    completed?: boolean
}

export interface DailyTask {
    id: number
    date: string
    name?: string
    tags: Tag[]
    task?: TaskExtended
    commonTask?: CommonTask
    action?: DailyTaskActionEnum
    completed: boolean
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
    CommonTask,
}
