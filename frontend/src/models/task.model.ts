import { Project } from '@/models/project.model'
import { Section } from '@/models/section.model'
import { Collection } from '@/models/collection.model'
import { Tag } from '@/models/tag.model'

export interface TaskPost {
  name: string
  tagIds: number[]
  projectId?: number
  sectionId?: number
  collectionId?: number
  afterId?: number | null
  beforeId?: number | null
  dueDate?: string | null
}

export interface TaskPatch {
  name?: string
  completed?: boolean
  tagIds?: number[]
  dueDate?: string | null
}

export interface Task {
  id: number
  name: string
  completed: boolean
  tags: Tag[]
  createdAt: string
  completedAt: string
  dueDate: string | null
  position: string
}

export interface TaskExtended extends Task {
  project?: Project
  section?: Section
  collection?: Collection
}

export interface DueContainerSummary {
  type: 'project' | 'collection'
  id: number
  late: number
  today: number
  planned: number
}

export interface DueSummary {
  late: number
  today: number
  containers: DueContainerSummary[]
}
