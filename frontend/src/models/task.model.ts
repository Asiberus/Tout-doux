import { Project, ProjectDetail } from '@/models/project.model'
import { SectionExtended } from '@/models/section.model'
import { Collection, CollectionDetail } from '@/models/collection.model'

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
    project?: Project
    section?: SectionExtended
    collection?: Collection
}
