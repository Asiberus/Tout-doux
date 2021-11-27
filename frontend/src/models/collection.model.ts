import { Task } from '@/models/task.model'

export interface Collection {
    id: number
    name: string
    description: string
    created_at: string
}

export interface CollectionTask extends Collection {
    tasks: Task[]
}
