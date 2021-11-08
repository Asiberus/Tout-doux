import { TaskModel } from '@/models/task.model'

export interface SectionModel {
    id: number
    name: string
    tasks: TaskModel[]
}

export interface SectionPost {
    name: string
    projectId: number
}
