import { Task } from '@/models/task.model'
import { Project } from '@/models/project.model'

export interface Section {
    id: number
    name: string
}

export interface SectionTask extends Section {
    tasks: Task[]
}

export interface SectionExtended extends Section {
    project: Project
}

export interface SectionPost {
    name: string
    projectId: number
}
