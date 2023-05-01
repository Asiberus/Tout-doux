import { TaskExtended } from '@/models/task.model'
import { CommonTask } from '@/models/common-task.model'
import { Tag } from '@/models/tag.model'

// Todo : add get literal in enum
export enum DailyTaskAction {
    THINK = 'TH',
    WORK = 'WO',
    FINISH = 'FI',
}

export interface DailyTaskPost {
    name?: string
    tagIds?: number[]
    taskId?: number
    commonTaskId?: number
    action?: DailyTaskAction
}

export interface DailyTaskPatch {
    name?: string
    tagIds?: number[]
    action?: DailyTaskAction | null
    completed?: boolean
}

export interface DailyTask {
    id: number
    date: string
    name?: string
    tags: Tag[]
    task?: TaskExtended
    commonTask?: CommonTask
    action?: DailyTaskAction
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
