import { ProjectTask } from '@/models/project.model'
import { SectionExtended, SectionTask } from '@/models/section.model'
import { CollectionTask } from '@/models/collection.model'

export interface TaskPost {
    id: number
    name: string
    completed: boolean
    created_at: string
    completed_at: string
    projectId?: number
    sectionId?: number
    collectionId?: number
}

export interface Task {
    id: number
    name: string
    completed: boolean
    created_at: string
    completed_at: string
}

export interface TaskExtended extends Task {
    project?: ProjectTask
    section?: SectionExtended
    collection?: CollectionTask
}
