import { Task } from '@/models/task.model'
import { Project } from '@/models/project.model'

export interface SectionTask {
    id: number
    projectId: number
    name: string
    tasks: Task[]
}

export interface SectionExtended {
    id: number
    projectId: number
    name: string
    project: Project
}
