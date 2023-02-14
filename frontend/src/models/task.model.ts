import { ProjectTask } from '@/models/project.model'
import { SectionExtended } from '@/models/section.model'
import { CollectionTask } from '@/models/collection.model'

export interface Task {
    id: number
    name: string
    completed: boolean
    createdAt: string
    completedAt: string
    projectId?: number
    sectionId?: number
    collectionId?: number
}

export interface TaskExtended {
    id: number
    name: string
    completed: boolean
    createdAt: string
    completedAt: string
    project?: ProjectTask
    section?: SectionExtended
    collection?: CollectionTask
}
