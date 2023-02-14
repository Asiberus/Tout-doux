import { Task } from '@/models/task.model'

export interface Collection {
    id: number
    name: string
    description: string
    createdOn: string
    archived: boolean
}

export interface CollectionDetail extends Collection {
    tasks: Task[]
}

export interface CollectionListModel {
    id: number
    name: string
    description: string
    archived: boolean
    createdOn: string
    taskCount: number
    completedTaskCount: number
}
