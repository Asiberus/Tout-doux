import { Task } from '@/models/task.model'

export interface CollectionPostOrPatch {
    name: string
    description: string
    archived: boolean
}
export interface Collection {
    id: number
    name: string
    description: string
    createdOn: string
    archived: boolean
}

export interface CollectionList extends Collection {
    taskCount: number
    completedTaskCount: number
}

export interface CollectionDetail extends Collection {
    tasks: Task[]
}
