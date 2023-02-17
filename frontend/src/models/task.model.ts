import { Project, ProjectDetail } from '@/models/project.model'
import { Section } from '@/models/section.model'
import { Collection, CollectionDetail } from '@/models/collection.model'

export interface TaskPost {
    name: string
    projectId?: number
    sectionId?: number
    collectionId?: number
}

export interface TaskPatch {
    name?: string
    completed?: boolean
}

export interface Task {
    id: number
    name: string
    completed: boolean
    createdAt: string
    completedAt: string
}

export interface TaskExtended {
    id: number
    name: string
    completed: boolean
    createdAt: string
    completedAt: string
    project?: Project
    section?: Section
    collection?: Collection
}
