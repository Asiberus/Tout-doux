import { TaskModel } from '@/models/task.model'
import { SectionModel } from '@/models/section.model'

export interface ProjectModel {
    id: number
    name: string
    description: string
    archived: boolean
    sections: SectionModel[]
    tasks: TaskModel[]
    created_at: string
}

export interface DailyTaskProjectDisplayModel extends ProjectModel {
    selected: boolean
}
