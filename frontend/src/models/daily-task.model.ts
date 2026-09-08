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
  date: string
  name?: string
  tagIds?: number[]
  taskId?: number
  commonTaskId?: number
  // `null` = aucune action : c'est la valeur par défaut de DailyTaskForm, partagé avec l'édition
  action?: DailyTaskAction | null
}

// Ce qu'émet un composant qui compose une ligne sans savoir sur quel jour elle atterrira. Le
// jour est ajouté par l'écran qui appelle l'API, seul à le connaître.
export type DailyTaskDraft = Omit<DailyTaskPost, 'date'>

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

// TODO : remove if not used
export interface DailyTaskDisplay extends DailyTask {
  editMode: boolean
}

// Todo : Change Name
export interface DailyTaskDisplayWrapper<T> {
  content: T
  selected: boolean
}

export enum DailyUpdateTaskTab {
  'Project',
  'Collection',
  'CommonTask',
}

export enum DailyTaskSheetDetent {
  Collapsed,
  Half,
  Full,
}
