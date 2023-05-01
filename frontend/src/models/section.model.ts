import { Task } from '@/models/task.model'
import { Project } from '@/models/project.model'

export interface SectionPost {
    name: string
    projectId: number
}

export interface SectionPatch {
    name: string
}

export interface SectionTask {
    id: number
    name: string
    tasks: Task[]
}

export interface Section {
    id: number
    name: string
    project: Project
}
