import { Project } from '@/models/project.model'

export interface EventModel {
    id: number
    name: string
    start_date: string
    end_date?: string
    takes_whole_day: boolean
    description?: string
    projectId?: number
}

export interface EventExtended {
    id: number
    name: string
    start_date: string
    end_date?: string
    takes_whole_day: boolean
    description?: string
    project: Project | null
}
