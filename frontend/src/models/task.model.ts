import { Project, ProjectDetail } from '@/models/project.model'
import { Section } from '@/models/section.model'
import { Collection, CollectionDetail } from '@/models/collection.model'
import { Tag } from '@/models/tag.model'

export interface TaskPost {
    name: string
    tagIds: number[]
    projectId?: number
    sectionId?: number
    collectionId?: number
}

export interface TaskPatch {
    name?: string
    completed?: boolean
    tagIds?: number[]
}

export interface Task {
    id: number
    name: string
    completed: boolean
    tags: Tag[]
    createdAt: string
    completedAt: string
}

export interface TaskExtended extends Task {
    project?: Project
    section?: Section
    collection?: Collection
}
