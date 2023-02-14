import { Task } from '@/models/task.model'

export interface Collection {
    id: number
    name: string
    description: string
    createdAt: string
    archived: boolean
}

export interface CollectionTask extends Collection {
    tasks: Task[]
}
